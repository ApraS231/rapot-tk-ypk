import React, { useState, useEffect } from 'react';
import { useToast } from '../../context/ToastContext';
import { 
  Save, 
  Loader2, 
  Info,
  Users,
  Compass,
  CheckCircle2,
  X
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  class_name?: string;
  special_needs?: string;
}

interface AssessmentFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assessmentId?: number | null;
  initialStudentId?: number | null;
}

export const AssessmentForm: React.FC<AssessmentFormModalProps> = ({ 
  isOpen, 
  onClose, 
  onSuccess, 
  assessmentId, 
  initialStudentId 
}) => {
  const { showToast } = useToast();

  const isEdit = !!assessmentId;

  const [studentId, setStudentId] = useState<number | ''>('');
  const [period, setPeriod] = useState('Semester 1 2025/2026');
  const [className, setClassName] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  
  // Qualitative fields
  const [motoric, setMotoric] = useState('');
  const [language, setLanguage] = useState('');
  const [social, setSocial] = useState('');
  const [cognitive, setCognitive] = useState('');
  const [independence, setIndependence] = useState('');
  const [summary, setSummary] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  // Escape key listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // Load students & edit data
  useEffect(() => {
    if (!isOpen) return;

    const loadForm = async () => {
      setFetching(true);
      try {
        const studentsRes = await fetch('/students/api/list');
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);

          if (initialStudentId && !isEdit) {
            const sId = Number(initialStudentId);
            setStudentId(sId);
            const found = studentsData.find((s: Student) => s.id === sId);
            if (found) {
              setClassName(found.class_name || '');
              setSpecialNeeds(found.special_needs || '');
            }
          }
        }

        if (isEdit && assessmentId) {
          const res = await fetch(`/assessments/api/detail/${assessmentId}`);
          if (res.ok) {
            const data = await res.json();
            setStudentId(data.student_id || '');
            setPeriod(data.period || '');
            setClassName(data.class_name || '');
            setSpecialNeeds(data.special_needs || '');
            setMotoric(data.motoric || '');
            setLanguage(data.language || '');
            setSocial(data.social || '');
            setCognitive(data.cognitive || '');
            setIndependence(data.independence || '');
            setSummary(data.summary || '');
          } else {
            showToast('Raport kualitatif tidak ditemukan.', 'error');
            onClose();
          }
        } else if (!initialStudentId) {
          // Clear form for fresh new creation
          setStudentId('');
          setPeriod('Semester 1 2025/2026');
          setClassName('');
          setSpecialNeeds('');
          setMotoric('');
          setLanguage('');
          setSocial('');
          setCognitive('');
          setIndependence('');
          setSummary('');
        }
      } catch (e) {
        showToast('Terjadi kesalahan memuat data.', 'error');
      } finally {
        setFetching(false);
      }
    };

    loadForm();
  }, [assessmentId, isEdit, initialStudentId, isOpen, showToast, onClose]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    setStudentId(val);
    if (val !== '') {
      const found = students.find(s => s.id === val);
      if (found) {
        setClassName(found.class_name || '');
        setSpecialNeeds(found.special_needs || '');
      }
    } else {
      setClassName('');
      setSpecialNeeds('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId) {
      showToast('Pilih siswa terlebih dahulu!', 'error');
      return;
    }

    if (!period.trim()) {
      showToast('Periode penilaian wajib diisi!', 'error');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/assessments/api/edit/${assessmentId}` : '/assessments/api/add';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        student_id: Number(studentId),
        period,
        class_name: className || '',
        special_needs: specialNeeds || '',
        motoric: motoric || '',
        language: language || '',
        social: social || '',
        cognitive: cognitive || '',
        independence: independence || '',
        summary: summary || ''
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEdit ? 'Raport kualitatif berhasil diperbarui!' : 'Raport kualitatif berhasil disimpan!', 'success');
        onSuccess();
        onClose();
      } else {
        const err = await res.json();
        showToast(err.detail || 'Gagal menyimpan raport.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl w-full max-w-4xl z-10 relative transform transition-all max-h-[90vh] overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
          title="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {fetching ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-slate-500 font-medium">Memuat formulir...</span>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Raport Kualitatif' : 'Buat Raport Kualitatif Baru'}</h2>
              <p className="text-xs text-slate-500 font-medium">Observasi narasi perkembangan kualitatif siswa per aspek perkembangan utama</p>
            </div>

            {/* Golden Ratio Grid layout */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Form: 61.8% */}
              <div className="w-full lg:w-[61.8%]">
                <form onSubmit={handleSubmit} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-6">
                  
                  {/* Siswa & Periode */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Pilih Siswa <span className="text-rose-500">*</span>
                      </label>
                      <div className="relative">
                        <Users className="absolute left-4 top-3 w-4 h-4 text-slate-400 z-10" />
                        <select
                          value={studentId}
                          disabled={isEdit}
                          onChange={handleStudentChange}
                          className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                        >
                          <option value="">-- Pilih Siswa --</option>
                          {students.map((student) => (
                            <option key={student.id} value={student.id}>
                              {student.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        Periode / Semester <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="Contoh: Semester 1 2025/2026"
                        value={period}
                        onChange={(e) => setPeriod(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
                      />
                    </div>
                  </div>

                  {/* Profile sync */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sinkronisasi Kelas Siswa
                      </label>
                      <input
                        type="text"
                        placeholder="Sinkronkan kelas..."
                        value={className}
                        onChange={(e) => setClassName(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none text-xs font-semibold"
                      />
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">
                        Sinkronisasi Diagnosa BK / Kebutuhan
                      </label>
                      <input
                        type="text"
                        placeholder="Sinkronkan diagnosa..."
                        value={specialNeeds}
                        onChange={(e) => setSpecialNeeds(e.target.value)}
                        className="w-full px-3 py-2 bg-white border border-slate-200 rounded-lg text-slate-800 focus:outline-none text-xs font-semibold"
                      />
                    </div>
                  </div>

                  <div className="space-y-4 pt-2">
                    <h3 className="font-bold text-slate-800 text-xs tracking-wider uppercase border-b border-slate-100 pb-2">
                      Aspek Observasi Perkembangan (Naratif)
                    </h3>

                    {/* Motorik */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        1. Aspek Fisik & Motorik (Kasar & Halus)
                      </label>
                      <textarea
                        placeholder="Deskripsikan koordinasi gerak kasar (melompat, keseimbangan) dan motorik halus (memegang pensil, menggunting, meronce)..."
                        rows={4}
                        value={motoric}
                        onChange={(e) => setMotoric(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
                      />
                    </div>

                    {/* Bahasa */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        2. Aspek Bahasa & Komunikasi (Reseptif & Ekspresif)
                      </label>
                      <textarea
                        placeholder="Deskripsikan pemahaman instruksi verbal, perbendaharaan kata, keberanian menjawab, pelafalan kata, atau penggunaan kartu isyarat..."
                        rows={4}
                        value={language}
                        onChange={(e) => setLanguage(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
                      />
                    </div>

                    {/* Sosial Emosional */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        3. Aspek Sosial, Emosional, & Interaksi
                      </label>
                      <textarea
                        placeholder="Deskripsikan interaksi dengan guru/teman, kepatuhan pada aturan kelas, kesabaran mengantre, kemampuan berbagi, dan kontrol emosi/tantrum..."
                        rows={4}
                        value={social}
                        onChange={(e) => setSocial(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
                      />
                    </div>

                    {/* Kognitif */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        4. Aspek Kognitif & Pemecahan Masalah
                      </label>
                      <textarea
                        placeholder="Deskripsikan pemahaman konsep warna/bentuk/angka, daya konsentrasi, kreativitas, kemampuan berhitung sederhana, atau logika menyusun puzzle..."
                        rows={4}
                        value={cognitive}
                        onChange={(e) => setCognitive(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
                      />
                    </div>

                    {/* Kemandirian */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        5. Aspek Kemandirian (Self-Care & ADL)
                      </label>
                      <textarea
                        placeholder="Deskripsikan kemandirian toilet training (toilet-hygiene), menggunakan sepatu/baju sendiri, merapikan mainan, atau mencuci tangan sendiri..."
                        rows={4}
                        value={independence}
                        onChange={(e) => setIndependence(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
                      />
                    </div>

                    {/* Kesimpulan & Saran */}
                    <div>
                      <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                        6. Kesimpulan & Rekomendasi untuk Orang Tua
                      </label>
                      <textarea
                        placeholder="Tuliskan saran tindak lanjut di rumah, apresiasi atas usaha anak didik, serta arahan khusus kolaborasi orang tua..."
                        rows={4}
                        value={summary}
                        onChange={(e) => setSummary(e.target.value)}
                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
                      />
                    </div>
                  </div>

                  {/* Submit Button */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
                    <button
                      type="submit"
                      disabled={loading}
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                      <span>{isEdit ? 'Perbarui Raport' : 'Simpan Raport'}</span>
                    </button>
                  </div>

                </form>
              </div>

              {/* Right Instructions Column: 38.2% */}
              <div className="w-full lg:w-[38.2%] space-y-6">
                <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
                  <div className="flex items-center gap-2 text-primary-600 border-b border-slate-100 pb-3">
                    <Info className="w-5 h-5 shrink-0" />
                    <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Petunjuk Penilaian</h3>
                  </div>
                  
                  <div className="space-y-4 text-xs text-slate-500 font-medium leading-relaxed">
                    <div className="flex gap-2.5">
                      <Compass className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-slate-700 mb-0.5">Aspek Kualitatif</h5>
                        <span>Asesmen ini bersifat kualitatif naratif. Jabarkan perkembangan anak secara holistik dari catatan harian yang telah dikumpulkan.</span>
                      </div>
                    </div>
                    
                    <div className="flex gap-2.5">
                      <CheckCircle2 className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <h5 className="font-bold text-slate-700 mb-0.5">Bahasa yang Positif</h5>
                        <span>Fokuskan narasi pada hal-hal yang <strong>bisa/telah dicapai</strong> anak didik, lalu ikuti dengan aspek-aspek yang <strong>membutuhkan bimbingan lebih lanjut</strong>.</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

            </div>

          </div>
        )}
      </div>
    </div>
  );
};
