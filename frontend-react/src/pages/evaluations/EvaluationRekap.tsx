import React, { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  Loader2, 
  Calendar,
  Info
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  Cell
} from 'recharts';

interface SelectedStudent {
  id: number;
  name: string;
  class_name: string | null;
  special_needs: string | null;
}

interface EvaluationHistoryItem {
  id: number;
  date: string;
  class_name: string | null;
  diagnosa: string | null;
  avg_cognitive: number;
  avg_motoric: number;
  avg_language: number;
  avg_social: number;
  avg_independence: number;
  composite_index: number;
  index_percentage: number;
  predicate: 'BSB' | 'BSH' | 'MB' | 'BB';
}

interface ComparisonTrendItem {
  name: string;
  prev: number;
  curr: number;
  diff: number;
  status: 'naik' | 'turun' | 'stabil';
}

interface ComparisonDataItem {
  student_id: number;
  student_name: string;
  class_name: string | null;
  special_needs: string | null;
  latest_evaluation: {
    id: number;
    date: string;
    composite_index: number;
    predicate: 'BSB' | 'BSH' | 'MB' | 'BB';
    avg_cognitive?: number;
    avg_motoric?: number;
    avg_language?: number;
    avg_social?: number;
    avg_independence?: number;
  } | null;
}

interface ChartData {
  dates: string[];
  composite: number[];
  cognitive: number[];
  motoric: number[];
  language: number[];
  social: number[];
  independence: number[];
}

interface RekapResponse {
  selected_student_id: number;
  selected_student: SelectedStudent | null;
  history: EvaluationHistoryItem[];
  comparison_trend: ComparisonTrendItem[];
  comparison_data: ComparisonDataItem[];
  chart_data: ChartData;
}

interface StudentListOption {
  id: number;
  name: string;
}

export const EvaluationRekap: React.FC = () => {
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const studentIdParam = searchParams.get('student_id');

  const [students, setStudents] = useState<StudentListOption[]>([]);
  const [selectedId, setSelectedId] = useState<string>(studentIdParam || '');
  const [rekapData, setRekapData] = useState<RekapResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [rekapLoading, setRekapLoading] = useState(false);

  // Load students list
  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await fetch('/students/api/list');
        if (res.ok) {
          const data = await res.json();
          setStudents(data);
          // If no student_id is in params and we have students, default to first student
          if (!studentIdParam && data.length > 0) {
            setSelectedId(data[0].id.toString());
            setSearchParams({ student_id: data[0].id.toString() });
          }
        }
      } catch (err) {
        showToast('Koneksi internet bermasalah.', 'error');
      }
    };
    fetchStudents();
  }, [studentIdParam, setSearchParams, showToast]);

  // Load rekap data when selected student changes
  useEffect(() => {
    if (!selectedId) return;

    const fetchRekap = async () => {
      setRekapLoading(true);
      try {
        const res = await fetch(`/evaluations/api/rekap?student_id=${selectedId}`);
        if (res.ok) {
          const data = await res.json();
          setRekapData(data);
        } else {
          showToast('Gagal memuat rekap perkembangan.', 'error');
        }
      } catch (err) {
        showToast('Koneksi internet bermasalah.', 'error');
      } finally {
        setRekapLoading(false);
        setLoading(false);
      }
    };

    fetchRekap();
  }, [selectedId, showToast]);

  const handleStudentChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    setSelectedId(val);
    setSearchParams({ student_id: val });
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus data penilaian ini?')) {
      return;
    }

    try {
      const res = await fetch(`/evaluations/api/delete/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Penilaian berhasil dihapus.', 'success');
        // Refresh rekap data
        const refreshRes = await fetch(`/evaluations/api/rekap?student_id=${selectedId}`);
        if (refreshRes.ok) {
          const data = await refreshRes.json();
          setRekapData(data);
        }
      } else {
        const data = await res.json();
        showToast(data.detail || 'Gagal menghapus penilaian.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Memuat data rekap...</span>
        </div>
      </div>
    );
  }

  // Pre-process chart data
  const hasHistory = rekapData && rekapData.history && rekapData.history.length > 0;
  
  let barChartData: { name: string; Skor: number }[] = [];
  let lineChartData: { name: string; 'Indeks Komposit': number }[] = [];
  
  if (hasHistory && rekapData.chart_data.dates.length > 0) {
    const cd = rekapData.chart_data;
    const lastIdx = cd.dates.length - 1;
    barChartData = [
      { name: 'Kognitif', Skor: cd.cognitive[lastIdx] },
      { name: 'Motorik', Skor: cd.motoric[lastIdx] },
      { name: 'Bahasa', Skor: cd.language[lastIdx] },
      { name: 'Sosial', Skor: cd.social[lastIdx] },
      { name: 'Mandiri', Skor: cd.independence[lastIdx] },
    ];
    lineChartData = cd.dates.map((date, idx) => ({
      name: date,
      'Indeks Komposit': cd.composite[idx]
    }));
  }

  // Custom colors for Bar Chart columns matching original template logic
  const BAR_COLORS = ['#f59e0b', '#ef4444', '#3b82f6', '#10b981', '#8b5cf6'];

  return (
    <div className="space-y-6">
      
      {/* ── SECTION 1: INDIVIDUAL ANALYSIS ── */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-6">
        
        {/* Section Header with Selector */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-4">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Analisis Progres Individual</h2>
            <p className="text-xs text-slate-400 font-medium">Pilih siswa untuk melihat grafik tren dan riwayat perkembangan kuantitatif</p>
          </div>
          <div className="shrink-0 w-full sm:w-auto">
            <select
              value={selectedId}
              onChange={handleStudentChange}
              className="w-full sm:w-64 px-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 font-semibold text-slate-700 bg-white transition"
            >
              <option value="">— Pilih Siswa —</option>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        {rekapLoading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
          </div>
        ) : rekapData && rekapData.selected_student && hasHistory ? (
          <div className="space-y-6">
            
            {/* Student Metadata Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-slate-50 border border-slate-100 rounded-xl">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Nama Siswa</span>
                <strong className="text-slate-800 text-sm font-bold">{rekapData.selected_student.name}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Kelas</span>
                <strong className="text-slate-700 text-sm font-semibold">{rekapData.selected_student.class_name || '—'}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Diagnosa</span>
                <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-50 text-amber-700 border border-amber-200 rounded-md text-[11px] font-bold">
                  {rekapData.selected_student.special_needs || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Penilaian Terakhir</span>
                <strong className="text-slate-700 text-sm font-medium">{formatDate(rekapData.history[0].date)}</strong>
              </div>
            </div>

            {/* GOLDEN RATIO GRID (61.8% Left vs 38.2% Right) */}
            <div className="flex flex-col lg:flex-row gap-6">
              
              {/* Left Column (61.8% width) - Charts and Period Comparisons */}
              <div className="w-full lg:w-[61.8%] space-y-6">
                
                {/* Charts Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Domain Bar Chart */}
                  <div className="p-4 border border-slate-200/50 rounded-xl bg-slate-50/30">
                    <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                      Profil Perkembangan per Domain
                    </h4>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis domain={[1, 4]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                            labelClassName="font-bold text-indigo-300"
                          />
                          <Bar dataKey="Skor" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={30}>
                            {barChartData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Composite Line Chart */}
                  <div className="p-4 border border-slate-200/50 rounded-xl bg-slate-50/30">
                    <h4 className="text-xs font-bold text-slate-700 mb-3 uppercase tracking-wider">
                      Tren Indeks Komposit Perkembangan
                    </h4>
                    <div className="h-60 w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                          <XAxis dataKey="name" stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <YAxis domain={[1, 4]} stroke="#94a3b8" fontSize={10} tickLine={false} />
                          <Tooltip 
                            contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '11px' }} 
                            labelClassName="font-bold text-indigo-300"
                          />
                          <Line type="monotone" dataKey="Indeks Komposit" stroke="#6366f1" strokeWidth={3} activeDot={{ r: 5 }} dot={{ strokeWidth: 2, r: 3 }} />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>


              </div>

              {/* Right Column (38.2% width) - Quick scorecard metrics & History Table */}
              <div className="w-full lg:w-[38.2%] space-y-6">
                {/* Scorecard Metric */}
                <div className="p-5 border border-slate-200/60 rounded-2xl bg-gradient-to-br from-indigo-50/50 to-primary-50/50 flex flex-col justify-between h-auto shadow-sm">
                  <div>
                    <h4 className="text-[10px] font-bold text-primary-700 uppercase tracking-wider mb-2">Penilaian Terkini</h4>
                    <div className="text-5xl font-black text-slate-800 leading-none tracking-tight mb-2">
                      {rekapData.history[0].composite_index.toFixed(2)}
                    </div>
                    <div className="text-xs text-slate-400 font-bold mb-4">Skor Maksimal: 4.00</div>
                    
                    <div className="space-y-2 text-xs font-semibold text-slate-600">
                      <div className="flex justify-between items-center bg-white/70 p-2 rounded-lg border border-slate-100">
                        <span>Persentase Indeks:</span>
                        <span className="text-primary-600 font-extrabold">{rekapData.history[0].index_percentage}%</span>
                      </div>
                      <div className="flex justify-between items-center bg-white/70 p-2 rounded-lg border border-slate-100">
                        <span>Predikat Akhir:</span>
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-extrabold ${
                          rekapData.history[0].predicate === 'BSB' ? 'bg-green-100 text-green-800' :
                          rekapData.history[0].predicate === 'BSH' ? 'bg-blue-100 text-blue-800' :
                          rekapData.history[0].predicate === 'MB' ? 'bg-amber-100 text-amber-800' :
                          'bg-rose-100 text-rose-800'
                        }`}>
                          {rekapData.history[0].predicate}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="mt-6 pt-4 border-t border-slate-200/60 flex gap-2">
                    <Info className="w-3.5 h-3.5 text-slate-400 shrink-0 mt-0.5" />
                    <p className="text-[10px] text-slate-400 font-medium leading-relaxed">
                      Bobot penilaian: Kognitif (25%), Motorik (25%), Bahasa (20%), Sosial (15%), Kemandirian (15%).
                    </p>
                  </div>
                </div>

                {/* Score Log Mini Table */}
                <div className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm">
                  <div className="px-4 py-3 bg-slate-50 border-b border-slate-100 font-bold text-xs text-slate-700 uppercase tracking-wider">
                    Daftar Penilaian
                  </div>
                  <div className="divide-y divide-slate-100 max-h-64 overflow-y-auto">
                    {rekapData.history.map((ev) => (
                      <div key={ev.id} className="p-3.5 hover:bg-slate-50/50 transition-colors flex items-center justify-between text-xs gap-3">
                        <div className="space-y-0.5">
                          <span className="font-bold text-slate-800 block">{formatDate(ev.date)}</span>
                          <span className="text-[10px] text-slate-400 font-bold block">
                            Indeks: {ev.composite_index.toFixed(2)} ({ev.index_percentage}%)
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            ev.predicate === 'BSB' ? 'bg-green-50 text-green-700 border border-green-200' :
                            ev.predicate === 'BSH' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                            ev.predicate === 'MB' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                            'bg-rose-50 text-rose-700 border border-rose-200'
                          }`}>
                            {ev.predicate}
                          </span>
                          <button
                            onClick={() => handleDelete(ev.id)}
                            className="text-rose-500 hover:text-rose-700 font-bold transition-colors cursor-pointer text-[10px] hover:underline"
                          >
                            Hapus
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

            </div>

          </div>
        ) : (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
              <Calendar className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">Tidak ada penilaian kuantitatif</h3>
            <p className="text-slate-400 text-xs mt-1 mb-4">Siswa terpilih belum memiliki catatan penilaian kuantitatif.</p>
            {selectedId && (
              <Link 
                to={`/evaluations/add?student_id=${selectedId}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition"
              >
                Mulai Skoring Indikator
              </Link>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
