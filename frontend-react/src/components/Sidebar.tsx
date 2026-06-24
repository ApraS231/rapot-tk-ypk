import React, { useState, useEffect } from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  FileEdit, 
  BarChart3, 
  History, 
  UserCog, 
  LogOut,
  ChevronLeft,
  ChevronRight,
  Menu,
  X
} from 'lucide-react';

export const Sidebar: React.FC = () => {
  const { user, logout } = useAuth();
  
  // Collapse state for desktop
  const [isCollapsed, setIsCollapsed] = useState(() => {
    return localStorage.getItem('sidebar-collapsed') === 'true';
  });

  // Open/close state for mobile menu
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  if (!user) return null;

  const toggleCollapse = () => {
    const nextState = !isCollapsed;
    setIsCollapsed(nextState);
    localStorage.setItem('sidebar-collapsed', String(nextState));
  };

  const activeClass = "bg-white/20 text-white shadow-md";
  const inactiveClass = "text-primary-100 hover:bg-white/10 hover:text-white";

  return (
    <aside 
      className={`h-auto lg:h-screen bg-gradient-to-b from-primary-700 to-primary-900 text-white flex flex-col shadow-2xl lg:sticky lg:top-0 lg:left-0 z-30 overflow-hidden transition-all duration-300 ease-in-out w-full ${
        isCollapsed ? 'lg:w-20' : 'lg:w-[23.6%]'
      }`}
    >
      {/* Brand Logo & Title */}
      <div 
        className={`flex border-b border-primary-600/50 transition-all duration-300 ${
          isCollapsed 
            ? 'flex-row items-center justify-between px-4 py-4 lg:flex-col lg:items-center lg:gap-3 lg:py-4 lg:px-2' 
            : 'flex-row items-center justify-between px-4 py-4 lg:py-5 lg:px-6'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white flex items-center justify-center p-1.5 overflow-hidden shadow-inner shrink-0">
            <img src="/static/YPK_LOGO.png" alt="Logo" className="w-full h-full object-contain" />
          </div>
          {!isCollapsed && (
            <div className="animate-in fade-in duration-300">
              <h1 className="font-bold text-base leading-tight tracking-wide whitespace-nowrap">E-Raport TK</h1>
              <span className="text-[10px] text-primary-200 font-medium whitespace-nowrap">Monitoring Perkembangan</span>
            </div>
          )}
        </div>
        
        {/* Toggle Button for Desktop */}
        <button
          onClick={toggleCollapse}
          className={`hidden lg:flex items-center justify-center p-1.5 rounded-lg bg-primary-850 hover:bg-primary-600/80 text-primary-100 hover:text-white transition-colors cursor-pointer ${
            isCollapsed ? 'w-8 h-8 mt-1' : ''
          }`}
          title={isCollapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {isCollapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <ChevronLeft className="w-4 h-4" />
          )}
        </button>

        {/* Toggle Button for Mobile */}
        <button
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          className="flex lg:hidden items-center justify-center p-2 rounded-lg bg-primary-850 hover:bg-primary-600/80 text-primary-100 hover:text-white transition-colors cursor-pointer"
          title={isMobileMenuOpen ? "Tutup Menu" : "Buka Menu"}
        >
          {isMobileMenuOpen ? (
            <X className="w-5 h-5" />
          ) : (
            <Menu className="w-5 h-5" />
          )}
        </button>
      </div>

      {/* Navigation Links and Footer - visible on desktop, or mobile when expanded */}
      <div 
        className={`flex-1 flex flex-col justify-between transition-all duration-300 ${
          isMobileMenuOpen ? 'max-h-[85vh] opacity-100 visible' : 'max-h-0 lg:max-h-none opacity-0 lg:opacity-100 invisible lg:visible'
        }`}
      >
        <nav className="flex-grow px-3 py-4 space-y-1 overflow-y-auto max-h-[calc(100vh-170px)]">
          <NavLink 
            to="/dashboard" 
            title={isCollapsed ? "Dashboard" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
              }`
            }
          >
            <LayoutDashboard className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Dashboard</span>}
          </NavLink>

          <NavLink 
            to="/students" 
            title={isCollapsed ? "Data Siswa" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
              }`
            }
          >
            <Users className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Data Siswa</span>}
          </NavLink>

          <NavLink 
            to="/daily-reports" 
            title={isCollapsed ? "Perkembangan Harian" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
              }`
            }
          >
            <BookOpen className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Perkembangan Harian</span>}
          </NavLink>

          <NavLink 
            to="/assessments" 
            title={isCollapsed ? "Raport Kualitatif" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
              }`
            }
          >
            <FileText className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Raport Kualitatif</span>}
          </NavLink>

          <NavLink 
            to="/gallery" 
            title={isCollapsed ? "Galeri Kegiatan" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
              }`
            }
          >
            <ImageIcon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Galeri Kegiatan</span>}
          </NavLink>

          {!isCollapsed ? (
            <div className="pt-3 pb-1 px-4 text-[10px] font-bold text-primary-300 uppercase tracking-widest animate-in fade-in duration-200">Fase Akhir</div>
          ) : (
            <hr className="border-primary-600/40 my-3" />
          )}
          
          <NavLink 
            to="/reports" 
            title={isCollapsed ? "Cetak Laporan" : undefined}
            onClick={() => setIsMobileMenuOpen(false)}
            className={({ isActive }) => 
              `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
              }`
            }
          >
            <Printer className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Cetak Laporan</span>}
          </NavLink>

          {user.role === 'admin' && (
            <>
              {!isCollapsed ? (
                <div className="pt-4 pb-1 px-4 text-[10px] font-bold text-primary-300 uppercase tracking-widest animate-in fade-in duration-200">Penilaian BK</div>
              ) : (
                <hr className="border-primary-600/40 my-3" />
              )}
              
              <NavLink 
                to="/evaluations/add" 
                title={isCollapsed ? "Input Penilaian BK" : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                    isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
                  }`
                }
              >
                <FileEdit className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-300">Input Penilaian</span>}
              </NavLink>

              <NavLink 
                to="/evaluations/rekap" 
                title={isCollapsed ? "Rekap & Komparasi Penilaian" : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                    isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
                  }`
                }
              >
                <BarChart3 className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-300">Rekap & Komparasi</span>}
              </NavLink>

              <NavLink 
                to="/evaluations" 
                end
                title={isCollapsed ? "Riwayat Penilaian BK" : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                    isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
                  }`
                }
              >
                <History className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-300">Riwayat Nilai</span>}
              </NavLink>

              {!isCollapsed ? (
                <div className="pt-4 pb-1 px-4 text-[10px] font-bold text-primary-300 uppercase tracking-widest animate-in fade-in duration-200">Admin</div>
              ) : (
                <hr className="border-primary-600/40 my-3" />
              )}
              
              <NavLink 
                to="/users" 
                title={isCollapsed ? "Manajemen Pengguna" : undefined}
                onClick={() => setIsMobileMenuOpen(false)}
                className={({ isActive }) => 
                  `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 transform hover:translate-x-1 ${isActive ? activeClass : inactiveClass} ${
                    isCollapsed ? 'lg:justify-center lg:px-2 lg:hover:translate-x-0' : ''
                  }`
                }
              >
                <UserCog className="w-5 h-5 shrink-0" />
                {!isCollapsed && <span className="animate-in fade-in duration-300">Manajemen Pengguna</span>}
              </NavLink>
            </>
          )}
        </nav>

        {/* User Information & Logout */}
        <div 
          className={`px-4 py-4 border-t border-primary-600/50 bg-primary-800/30 transition-all duration-300 ${
            isCollapsed ? 'lg:px-2 lg:text-center' : ''
          }`}
        >
          <div 
            className={`flex items-center gap-3 mb-3 transition-all duration-300 ${
              isCollapsed ? 'lg:flex-col lg:gap-1 lg:mb-2' : ''
            }`}
          >
            <div className="w-9 h-9 rounded-xl bg-accent-500 flex items-center justify-center text-sm font-bold text-white shadow shadow-accent-600/50 shrink-0">
              {user.name[0].toUpperCase()}
            </div>
            {!isCollapsed && (
              <div className="flex-1 min-w-0 animate-in fade-in duration-300">
                <div className="text-sm font-semibold truncate leading-tight">{user.name}</div>
                <div className="text-[11px] text-primary-300 capitalize">{user.role}</div>
              </div>
            )}
          </div>
          <button 
            onClick={logout}
            title={isCollapsed ? "Keluar" : undefined}
            className={`flex items-center justify-center gap-2 px-3 py-2 rounded-xl text-sm font-medium text-rose-200 hover:text-white hover:bg-rose-600/20 border border-rose-500/20 hover:border-rose-500/40 transition-all duration-200 cursor-pointer ${
              isCollapsed ? 'lg:px-0 lg:w-9 lg:h-9' : 'w-full'
            }`}
          >
            <LogOut className="w-4 h-4 shrink-0" />
            {!isCollapsed && <span className="animate-in fade-in duration-300">Keluar</span>}
          </button>
        </div>
      </div>
    </aside>
  );
};
