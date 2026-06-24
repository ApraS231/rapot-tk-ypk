import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  Save, 
  ArrowLeft, 
  Loader2, 
  CheckCircle2, 
  Info, 
  HelpCircle,
  FileSpreadsheet
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  class_name: string;
  special_needs: string;
}

interface IndicatorItem {
  id: string;
  text: string;
}

interface IndicatorDomain {
  title: string;
  weight: number;
  items: IndicatorItem[];
}

type IndicatorsData = Record<string, IndicatorDomain>;

export const EvaluationForm: React.FC = () => {
  const navigate = useNavigate();
  const { showToast } = useToast();
  const [searchParams] = useSearchParams();
  const preselectedStudentId = searchParams.get('student_id');

  // Form State
  const [students, setStudents] = useState<Student[]>([]);
  const [indicators, setIndicators] = useState<IndicatorsData>({});
  const [selectedStudentId, setSelectedStudentId] = useState<string>(preselectedStudentId || '');
  const [date, setDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [className, setClassName] = useState<string>('');
  const [diagnosa, setDiagnosa] = useState<string>('');
  const [scores, setScores] = useState<Record<string, number>>({});
  
  // UI State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        // Fetch students
        const studentsRes = await fetch('/students/api/list');
        const studentsData = await studentsRes.json();
        setStudents(studentsData);

        // Fetch indicators
        const indicatorsRes = await fetch('/evaluations/api/indicators');
        if (indicatorsRes.ok) {
          const indicatorsData: IndicatorsData = await indicatorsRes.json();
          setIndicators(indicatorsData);
          
          // Set first tab as active
          const firstTabKey = Object.keys(indicatorsData)[0];
          setActiveTab(firstTabKey || '');

          // Prepopulate scores with default value of 1 for all items
          const initialScores: Record<string, number> = {};
          Object.values(indicatorsData).forEach((domain) => {
            domain.items.forEach((item) => {
              initialScores[item.id] = 0; // 0 represents unanswered/not set
            });
          });
          setScores(initialScores);
        } else {
          showToast('Gagal memuat indikator penilaian.', 'error');
        }

        // If preselected student id is provided, autofill fields
        if (preselectedStudentId) {
          const found = studentsData.find((s: Student) => s.id === parseInt(preselectedStudentId));
          if (found) {
            setClassName(found.class_name || '');
            setDiagnosa(found.special_needs || '');
          }
        }

      } catch (err) {
        showToast('Koneksi internet bermasalah.', 'error');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [preselectedStudentId, showToast]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const idVal = e.target.value;
    setSelectedStudentId(idVal);
    if (idVal) {
      const student = students.find(s => s.id === parseInt(idVal));
      if (student) {
        setClassName(student.class_name || '');
        setDiagnosa(student.special_needs || '');
      }
    } else {
      setClassName('');
      setDiagnosa('');
    }
  };

  const handleScoreChange = (itemId: string, val: number) => {
    setScores(prev => ({
      ...prev,
      [itemId]: val
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedStudentId) {
      showToast('Pilih siswa terlebih dahulu.', 'error');
      return;
    }
    if (!className) {
      showToast('Kelas wajib dipilih.', 'error');
      return;
    }
    if (!diagnosa) {
      showToast('Diagnosa Psikolog/Dokter wajib diisi.', 'error');
      return;
    }

    // Check for unanswered scores
    const unansweredItems: string[] = [];
    Object.entries(indicators).forEach(([domainKey, domain]) => {
      domain.items.forEach((item) => {
        if (!scores[item.id] || scores[item.id] === 0) {
          unansweredItems.push(item.text);
        }
      });
    });

    if (unansweredItems.length > 0) {
      // Find the tab of the first unanswered item to focus it
      let foundTabKey = '';
      for (const [domainKey, domain] of Object.entries(indicators)) {
        const hasUnanswered = domain.items.some(item => !scores[item.id] || scores[item.id] === 0);
        if (hasUnanswered) {
          foundTabKey = domainKey;
          break;
        }
      }

      if (foundTabKey) {
        setActiveTab(foundTabKey);
      }

      showToast(`Masih ada ${unansweredItems.length} indikator yang belum dinilai!`, 'error');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/evaluations/api/add', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          student_id: parseInt(selectedStudentId),
          date,
          class_name: className,
          diagnosa,
          scores
        }),
      });

      if (res.ok) {
        showToast('Penilaian kuantitatif berhasil disimpan!', 'success');
        navigate(`/evaluations/rekap?student_id=${selectedStudentId}`);
      } else {
        const data = await res.json();
        showToast(data.detail || 'Gagal menyimpan penilaian.', 'error');
      }
    } catch (err) {
      showToast('Gagal menghubungkan ke server.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Memuat data indikator...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Top action bar */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate('/evaluations')}
          className="inline-flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors text-sm font-semibold cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Riwayat</span>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col lg:flex-row gap-6">
        
        {/* Main Scoring Column - Golden Ratio Left Column (61.8%) */}
        <div className="w-full lg:w-[61.8%] space-y-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-800">Skoring Aspek & Indikator</h3>
                <p className="text-xs text-slate-400">Pilih aspek perkembangan di tab, lalu berikan nilai 1 sampai 4</p>
              </div>
            </div>

            {/* Tabs Row */}
            <div className="flex border-b border-slate-100 overflow-x-auto pb-px gap-2">
              {Object.entries(indicators).map(([key, domain]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setActiveTab(key)}
                  className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all whitespace-nowrap cursor-pointer ${
                    activeTab === key
                      ? 'border-primary-500 text-primary-600'
                      : 'border-transparent text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {domain.title}
                </button>
              ))}
            </div>

            {/* Active Domain Panel */}
            {activeTab && indicators[activeTab] && (
              <div className="mt-6 space-y-4">
                <div className="bg-indigo-50/70 border border-indigo-100/50 rounded-xl p-4 flex items-center justify-between">
                  <span className="text-xs text-indigo-700 font-semibold">
                    Aspek: <strong className="text-sm font-bold text-indigo-900">{indicators[activeTab].title}</strong>
                  </span>
                  <span className="px-2.5 py-0.5 bg-indigo-100/70 text-indigo-800 rounded-full text-xs font-semibold">
                    Bobot: {(indicators[activeTab].weight * 100).toFixed(0)}%
                  </span>
                </div>

                <div className="space-y-3">
                  {indicators[activeTab].items.map((item, idx) => {
                    const currentVal = scores[item.id] || 0;
                    return (
                      <div 
                        key={item.id} 
                        className={`p-4 border rounded-xl transition-all flex flex-col md:flex-row md:items-center justify-between gap-4 ${
                          currentVal === 0 
                            ? 'border-slate-100 bg-white hover:border-slate-200' 
                            : 'border-emerald-100 bg-emerald-50/10'
                        }`}
                      >
                        <div className="flex-1 flex items-start gap-3">
                          <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-slate-100 text-slate-600 font-bold text-xs shrink-0">
                            {idx + 1}
                          </span>
                          <span className="text-sm font-medium text-slate-700 leading-relaxed">
                            {item.text}
                          </span>
                        </div>

                        {/* Radio options */}
                        <div className="flex items-center gap-4 justify-between md:justify-end shrink-0 border-t md:border-t-0 pt-3 md:pt-0">
                          {[
                            { val: 1, label: 'BB', color: 'text-rose-600 focus:ring-rose-500' },
                            { val: 2, label: 'MB', color: 'text-amber-600 focus:ring-amber-500' },
                            { val: 3, label: 'BSH', color: 'text-blue-600 focus:ring-blue-500' },
                            { val: 4, label: 'BSB', color: 'text-emerald-600 focus:ring-emerald-500' }
                          ].map((opt) => (
                            <label 
                              key={opt.val} 
                              className={`flex items-center gap-1.5 cursor-pointer select-none group px-2 py-1 rounded-lg transition-colors ${
                                currentVal === opt.val 
                                  ? 'bg-slate-100' 
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <input
                                type="radio"
                                name={item.id}
                                value={opt.val}
                                checked={currentVal === opt.val}
                                onChange={() => handleScoreChange(item.id, opt.val)}
                                className={`w-4 h-4 border-slate-300 transition ${opt.color}`}
                              />
                              <span className={`text-xs font-bold transition-colors ${
                                currentVal === opt.val 
                                  ? 'text-slate-900 font-extrabold' 
                                  : 'text-slate-400 group-hover:text-slate-700'
                              }`}>
                                {opt.label}
                              </span>
                            </label>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Metadata Column - Golden Ratio Right Column (38.2%) */}
        <div className="w-full lg:w-[38.2%] space-y-6">
          {/* Form Fields Card */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            <h3 className="font-bold text-slate-800 text-sm border-b border-slate-50 pb-2">Informasi Penilaian</h3>
            
            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Nama Siswa <span className="text-rose-500">*</span>
              </label>
              <select
                value={selectedStudentId}
                onChange={handleStudentChange}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
              >
                <option value="">— Pilih Siswa —</option>
                {students.map((student) => (
                  <option key={student.id} value={student.id}>
                    {student.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Tanggal Penilaian <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Kelas <span className="text-rose-500">*</span>
              </label>
              <select
                value={className}
                onChange={(e) => setClassName(e.target.value)}
                required
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
              >
                <option value="">— Pilih Kelas —</option>
                <option value="TK A">TK A</option>
                <option value="TK B">TK B</option>
                <option value="Kelompok Bermain">Kelompok Bermain</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                Diagnosa Psikolog/Dokter <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                value={diagnosa}
                onChange={(e) => setDiagnosa(e.target.value)}
                required
                placeholder="Misal: Autisme, ADHD, Down Syndrome..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
              />
            </div>

            <div className="pt-4 border-t border-slate-100">
              <button
                type="submit"
                disabled={submitting}
                className="w-full flex items-center justify-center gap-2 py-3 bg-primary-600 hover:bg-primary-700 disabled:bg-primary-400 text-white font-semibold rounded-xl text-sm transition-all shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 cursor-pointer"
              >
                {submitting ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Menyimpan...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4" />
                    <span>Simpan & Hitung Penilaian</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Guide Card */}
          <div className="bg-slate-50 border border-slate-200/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-indigo-700">
              <HelpCircle className="w-4 h-4 shrink-0" />
              <h4 className="font-bold text-xs uppercase tracking-wider">Kunci Predikat Penilaian</h4>
            </div>
            
            <div className="space-y-3 text-xs text-slate-600">
              <div className="flex gap-2">
                <span className="w-10 text-center font-bold px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 border border-rose-200 shrink-0">BB</span>
                <div>
                  <div className="font-bold text-slate-800">Belum Berkembang (Skor 1)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Anak belum mampu melakukan indikator meskipun dibimbing penuh</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-10 text-center font-bold px-1.5 py-0.5 rounded bg-amber-100 text-amber-800 border border-amber-200 shrink-0">MB</span>
                <div>
                  <div className="font-bold text-slate-800">Mulai Berkembang (Skor 2)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Anak mulai mampu melakukan indikator dengan bantuan/bimbingan verbal/fisik</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-10 text-center font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 shrink-0">BSH</span>
                <div>
                  <div className="font-bold text-slate-800">Berkembang Sesuai Harapan (Skor 3)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Anak mampu melakukan secara mandiri dan konsisten tanpa bantuan</p>
                </div>
              </div>
              <div className="flex gap-2">
                <span className="w-10 text-center font-bold px-1.5 py-0.5 rounded bg-green-100 text-green-800 border border-green-200 shrink-0">BSB</span>
                <div>
                  <div className="font-bold text-slate-800">Berkembang Sangat Baik (Skor 4)</div>
                  <p className="text-[11px] text-slate-400 mt-0.5">Anak mandiri, konsisten, dan mampu membantu/mencontohkan kepada temannya</p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-white border border-slate-200/50 rounded-xl flex gap-2">
              <Info className="w-4 h-4 text-primary shrink-0 mt-0.5" />
              <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                Skor akhir dihitung secara berbobot dari kelima aspek utama. Indeks Persentase dihitung untuk memetakan capaian anak.
              </p>
            </div>
          </div>
        </div>

      </form>
    </div>
  );
};
