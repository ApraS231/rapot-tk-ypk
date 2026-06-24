import React from 'react';
import { Sidebar } from './Sidebar';
import { useAuth } from '../context/AuthContext';
import { useLocation } from 'react-router-dom';
import { LogOut } from 'lucide-react';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  if (!user) return <>{children}</>; // Render without layout for login page

  // Format current date in Indonesian
  const currentDate = new Date().toLocaleDateString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });

  // Determine page title based on path
  const getPageTitle = () => {
    const path = location.pathname;
    if (path.startsWith('/dashboard')) return 'Dashboard';
    if (path.startsWith('/students')) return 'Data Siswa';
    if (path.startsWith('/daily-reports')) return 'Perkembangan Harian';
    if (path.startsWith('/assessments')) return 'Raport Kualitatif';
    if (path.startsWith('/gallery')) return 'Galeri Kegiatan';
    if (path.startsWith('/reports')) return 'Cetak Laporan';
    if (path.startsWith('/evaluations/add')) return 'Input Penilaian BK';
    if (path.startsWith('/evaluations/rekap')) return 'Rekap & Komparasi Penilaian';
    if (path.startsWith('/evaluations')) return 'Riwayat Penilaian BK';
    if (path.startsWith('/users')) return 'Manajemen Pengguna';
    return 'E-Raport';
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50 font-sans text-slate-800">
      {/* Sidebar - Golden Ratio: takes 23.6% width on desktop */}
      <Sidebar />

      {/* Main Content - Dynamic width based on remaining screen space */}
      <div className="flex-grow flex-1 flex flex-col min-h-screen min-w-0 overflow-x-hidden">
        {/* Topbar/Header */}
        <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between sticky top-0 z-20 shadow-sm gap-2 no-print">
          <h2 className="text-lg font-bold text-slate-700 leading-tight">
            {getPageTitle()}
          </h2>
          <div className="flex items-center gap-4 text-sm">
            <span className="text-slate-500 font-medium">{currentDate}</span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold uppercase tracking-wider ${
              user.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
            }`}>
              {user.role}
            </span>
            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-rose-50 hover:bg-rose-100 text-rose-600 border border-rose-200/60 transition-all duration-200 shadow-sm hover:shadow cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar</span>
            </button>
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 p-6">
          {children}
        </main>

        {/* Footer */}
        <footer className="text-center text-xs text-slate-400 py-4 border-t border-slate-200/40 no-print">
          E-Raport TK ABK &copy; {new Date().getFullYear()} — Sistem Pelaporan Perkembangan Anak Berkebutuhan Khusus
        </footer>
      </div>
    </div>
  );
};
