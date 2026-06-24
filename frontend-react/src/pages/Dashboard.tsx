import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { 
  Users, 
  ClipboardList, 
  FileCheck, 
  Image as ImageIcon, 
  PlusCircle, 
  BookOpen, 
  ArrowRight, 
  TrendingUp, 
  FileEdit,
  UserPlus,
  Loader2
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
  Legend
} from 'recharts';

interface Report {
  id: number;
  student_name: string;
  date: string;
  notes: string;
  behavior: string;
  social_interaction: string;
}

interface DashboardData {
  total_students: number;
  total_reports_today: number;
  total_assessments: number;
  total_gallery_items: number;
  total_graded_students: number;
  recent_reports: Report[];
  chart_data: {
    bar: {
      labels: string[];
      data: number[];
    };
    line: {
      labels: string[];
      data: number[];
    };
  };
}

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await fetch('/api/dashboard');
        if (res.ok) {
          const dashboardData = await res.json();
          setData(dashboardData);
        } else {
          showToast('Gagal memuat data dashboard.', 'error');
        }
      } catch (err) {
        showToast('Kesalahan koneksi ke server.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboard();
  }, [showToast]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[500px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Memuat data dashboard...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  // Prepare chart datasets for Recharts
  const barChartData = data.chart_data.bar.labels.map((label, idx) => ({
    name: label,
    'Indeks Komposit': data.chart_data.bar.data[idx]
  }));

  const lineChartData = data.chart_data.line.labels.map((label, idx) => ({
    name: label,
    'Rata-rata Indeks': data.chart_data.line.data[idx]
  }));

  // Format date to local Indonesian
  const formatReportDate = (isoString: string) => {
    if (!isoString) return '';
    const date = new Date(isoString);
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  };

  return (
    <div className="space-y-6">
      {/* ── Welcome Banner ── */}
      <div className="bg-gradient-to-r from-primary-600 to-indigo-700 text-white rounded-2xl p-6 shadow-lg shadow-primary-500/10">
        <h2 className="text-xl lg:text-2xl font-bold tracking-tight">
          Selamat Datang, {user?.name}!
        </h2>
        <p className="text-primary-100 text-xs sm:text-sm mt-1 font-medium">
          Anda masuk sebagai <span className="font-bold underline capitalize">{user?.role}</span>. Pantau dan catat perkembangan akademis serta perilaku anak dengan mudah di portal digital.
        </p>
      </div>

      {/* ── Golden Ratio Layout ── */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* 📐 Main Area (Left Column - 61.8% width on desktop) */}
        <div className="w-full lg:w-[61.8%] space-y-6">
          
          {/* Charts Section */}
          <div className="grid grid-cols-1 gap-6">
            {/* Bar Chart: composite index by student (BK/Admin) */}
            {user?.role === 'admin' && barChartData.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                    Indeks Komposit Perkembangan Siswa
                  </h3>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={barChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[1, 4]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                        labelClassName="font-bold text-primary-300"
                      />
                      <Bar dataKey="Indeks Komposit" fill="#6366f1" radius={[4, 4, 0, 0]} maxBarSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Line Chart: Monthly Averages (BK/Admin) */}
            {user?.role === 'admin' && lineChartData.length > 0 && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
                <div className="flex items-center gap-2 mb-4">
                  <TrendingUp className="w-5 h-5 text-accent-500" />
                  <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">
                    Tren Rata-rata Perkembangan Bulanan
                  </h3>
                </div>
                <div className="h-[250px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={lineChartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                      <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis domain={[1, 4]} stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ background: '#0f172a', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '12px' }} 
                        labelClassName="font-bold text-accent-300"
                      />
                      <Line type="monotone" dataKey="Rata-rata Indeks" stroke="#f59e0b" strokeWidth={3} activeDot={{ r: 6 }} dot={{ strokeWidth: 2, r: 4 }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* If shadow teacher or no evaluations exist yet */}
            {(user?.role !== 'admin' || barChartData.length === 0) && (
              <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 bg-primary-50 rounded-2xl flex items-center justify-center text-primary-500 mb-4">
                  <ClipboardList className="w-8 h-8" />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Sistem E-Raport TK Kasih</h3>
                <p className="text-slate-500 text-xs sm:text-sm mt-1 max-w-sm">
                  Gunakan menu samping untuk mengelola biodata siswa dampingan, menulis laporan harian, mengunggah foto kegiatan, serta mengisi observasi raport berkala.
                </p>
              </div>
            )}
          </div>
          
          {/* Quick Actions Panel */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase mb-4">Aksi Cepat</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {user?.role === 'admin' ? (
                <>
                  <Link 
                    to="/students/add" 
                    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-primary-50 border border-slate-200/60 hover:border-primary-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2.5 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <UserPlus className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Tambah Siswa Baru</div>
                      <div className="text-xs text-slate-500 mt-0.5">Kelola biodata dasar siswa</div>
                    </div>
                  </Link>
                  <Link 
                    to="/evaluations/add" 
                    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-accent-50 border border-slate-200/60 hover:border-accent-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2.5 bg-accent-100 text-accent-600 rounded-lg group-hover:bg-accent-500 group-hover:text-white transition-colors">
                      <FileEdit className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Input Penilaian BK</div>
                      <div className="text-xs text-slate-500 mt-0.5">Penilaian kuantitatif instrumen BK</div>
                    </div>
                  </Link>
                </>
              ) : (
                <>
                  <Link 
                    to="/daily-reports/add" 
                    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-primary-50 border border-slate-200/60 hover:border-primary-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2.5 bg-primary-100 text-primary-600 rounded-lg group-hover:bg-primary-500 group-hover:text-white transition-colors">
                      <BookOpen className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Tulis Laporan Harian</div>
                      <div className="text-xs text-slate-500 mt-0.5">Catat aktivitas dan perilaku siswa</div>
                    </div>
                  </Link>
                  <Link 
                    to="/assessments?add=true" 
                    className="flex items-center gap-3 p-4 bg-slate-50 hover:bg-accent-50 border border-slate-200/60 hover:border-accent-200 rounded-xl transition-all duration-200 group"
                  >
                    <div className="p-2.5 bg-accent-100 text-accent-600 rounded-lg group-hover:bg-accent-500 group-hover:text-white transition-colors">
                      <PlusCircle className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="font-bold text-slate-800 text-sm">Buat Raport Kualitatif</div>
                      <div className="text-xs text-slate-500 mt-0.5">Isi evaluasi berkala per aspek</div>
                    </div>
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>

        {/* 📐 Side Panel (Right Column - 38.2% width on desktop) */}
        <div className="w-full lg:w-[38.2%] space-y-6">
          
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-all">
              <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl shrink-0">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400">Total Siswa</span>
                <span className="block text-lg font-bold text-slate-800 mt-0.5">{data.total_students}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-all">
              <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-xl shrink-0">
                <ClipboardList className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400">Laporan Hari Ini</span>
                <span className="block text-lg font-bold text-slate-800 mt-0.5">{data.total_reports_today}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-all">
              <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl shrink-0">
                <FileCheck className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400">Raport Semester</span>
                <span className="block text-lg font-bold text-slate-800 mt-0.5">{data.total_assessments}</span>
              </div>
            </div>

            <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex items-center gap-3 hover:border-slate-300 transition-all">
              <div className="p-2.5 bg-amber-50 text-amber-600 rounded-xl shrink-0">
                <ImageIcon className="w-5 h-5" />
              </div>
              <div>
                <span className="block text-xs font-semibold text-slate-400">Galeri Foto</span>
                <span className="block text-lg font-bold text-slate-800 mt-0.5">{data.total_gallery_items}</span>
              </div>
            </div>
          </div>

          {/* Recent Reports List */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Laporan Harian Terbaru</h3>
              <Link to="/daily-reports" className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center gap-1">
                Semua <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
            
            {data.recent_reports.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs font-medium">
                Belum ada laporan harian yang diisi hari ini.
              </div>
            ) : (
              <div className="space-y-4">
                {data.recent_reports.map((report) => (
                  <div key={report.id} className="p-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl transition-all">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-slate-800 text-xs truncate">{report.student_name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold bg-slate-100 px-2 py-0.5 rounded-full shrink-0">
                        {formatReportDate(report.date)}
                      </span>
                    </div>
                    {report.notes && (
                      <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                        {report.notes}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};
