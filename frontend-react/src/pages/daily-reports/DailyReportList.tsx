import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  ClipboardList, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Loader2, 
  Filter,
  Calendar as CalendarIcon,
  List as ListIcon,
  X,
  Smile,
  Heart,
  Activity,
  User,
  Image as ImageIcon
} from 'lucide-react';
import { Calendar, momentLocalizer, Views } from 'react-big-calendar';
import moment from 'moment';
// @ts-ignore
import 'moment/locale/id';
import 'react-big-calendar/lib/css/react-big-calendar.css';

// Initialize moment locale
moment.locale('id');
const localizer = momentLocalizer(moment);

interface Student {
  id: number;
  name: string;
}

interface Report {
  id: number;
  student_id: number;
  student_name: string;
  date: string;
  notes: string;
  behavior: string;
  social_interaction: string;
  created_by: number;
  photos?: string[];
}

interface CalendarEvent {
  id: number;
  title: string;
  start: Date;
  end: Date;
  resource: Report;
}

export const DailyReportList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  
  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [currentDate, setCurrentDate] = useState<Date>(new Date());

  useEffect(() => {
    if (user) {
      setViewMode(user.role === 'admin' ? 'list' : 'calendar');
    }
  }, [user]);
  
  // Modal state
  const [selectedReport, setSelectedReport] = useState<Report | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchReports = async (studentId: number | '' = '') => {
    setLoading(true);
    try {
      const url = studentId ? `/daily-reports/api/list?student_id=${studentId}` : '/daily-reports/api/list';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      } else {
        showToast('Gagal memuat laporan harian.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFiltersAndReports = async () => {
      try {
        const studentsRes = await fetch('/students/api/list');
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
      } catch (e) {
        // Ignored
      }
      fetchReports();
    };

    loadFiltersAndReports();
  }, [showToast]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    setSelectedStudent(val);
    fetchReports(val);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus catatan harian ini?')) {
      return;
    }

    try {
      const res = await fetch(`/daily-reports/api/delete/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Catatan harian berhasil dihapus!', 'success');
        setReports(prev => prev.filter(r => r.id !== id));
        setIsModalOpen(false);
        setSelectedReport(null);
      } else {
        const err = await res.json();
        showToast(err.detail || 'Gagal menghapus laporan.', 'error');
      }
    } catch (e) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  const formatReportDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  // Convert reports to calendar events safely parsing date
  const events: CalendarEvent[] = reports.map(r => {
    const [year, month, day] = r.date.split('-').map(Number);
    const eventDate = new Date(year, month - 1, day);
    return {
      id: r.id,
      title: r.student_name,
      start: eventDate,
      end: eventDate,
      resource: r
    };
  });

  const studentColorSchemes = [
    { bg: '#fef08a', text: '#854d0e', border: '#fde047' }, // Soft Yellow
    { bg: '#dcfce7', text: '#15803d', border: '#bbf7d0' }, // Soft Green
    { bg: '#dbeafe', text: '#1d4ed8', border: '#bfdbfe' }, // Soft Blue
    { bg: '#ffedd5', text: '#ea580c', border: '#fed7aa' }, // Soft Orange
    { bg: '#fce7f3', text: '#be185d', border: '#fbcfe8' }  // Soft Pink
  ];

  const eventPropGetter = (event: CalendarEvent) => {
    const scheme = studentColorSchemes[event.resource.student_id % studentColorSchemes.length];
    return {
      style: {
        backgroundColor: scheme.bg,
        color: scheme.text,
        border: `1px solid ${scheme.border}`,
        borderRadius: '9999px',
      }
    };
  };

  const handleSelectEvent = (event: CalendarEvent) => {
    setSelectedReport(event.resource);
    setIsModalOpen(true);
  };

  const handleSelectSlot = (slotInfo: { start: Date }) => {
    if (user?.role === 'pendamping') {
      const formattedDate = moment(slotInfo.start).format('YYYY-MM-DD');
      navigate(`/daily-reports/add?date=${formattedDate}`);
    }
  };

  const calendarMessages = {
    allDay: 'Seharian',
    previous: 'Sebelumnya',
    next: 'Berikutnya',
    today: 'Hari Ini',
    month: 'Bulan',
    week: 'Minggu',
    day: 'Hari',
    agenda: 'Agenda',
    date: 'Tanggal',
    time: 'Waktu',
    event: 'Catatan',
    noEventsInRange: 'Tidak ada catatan harian dalam periode ini.',
    showMore: (total: number) => `+ Lihat ${total} catatan lagi`
  };

  const customCalendarStyles = `
    .rbc-calendar {
      font-family: inherit;
    }
    .rbc-toolbar button {
      border: 1px solid #e2e8f0 !important;
      background-color: #ffffff !important;
      color: #475569 !important;
      font-weight: 600 !important;
      font-size: 0.825rem !important;
      border-radius: 0.75rem !important;
      padding: 0.4rem 0.85rem !important;
      margin: 0 2px !important;
      transition: all 0.2s !important;
      cursor: pointer !important;
      outline: none !important;
    }
    .rbc-toolbar button:hover {
      background-color: #f8fafc !important;
      color: #0f172a !important;
    }
    .rbc-toolbar button.rbc-active {
      background-color: #4f46e5 !important;
      color: #ffffff !important;
      border-color: #4f46e5 !important;
      box-shadow: 0 4px 6px -1px rgba(79, 70, 229, 0.1) !important;
    }
    .rbc-header {
      border-bottom: 2px solid #e2e8f0 !important;
      padding: 8px 0 !important;
      font-weight: 700 !important;
      font-size: 0.725rem !important;
      text-transform: uppercase !important;
      color: #64748b !important;
      letter-spacing: 0.05em !important;
    }
    .rbc-month-view {
      border: 1px solid #e2e8f0 !important;
      border-radius: 1rem !important;
      overflow: hidden !important;
      background-color: #ffffff !important;
      box-shadow: 0 1px 3px 0 rgba(0, 0, 0, 0.05) !important;
    }
    .rbc-today {
      background-color: #eef2ff !important;
    }
    .rbc-today .rbc-date-cell {
      font-weight: 800 !important;
    }
    .rbc-today .rbc-date-cell .rbc-button-link {
      background-color: #4f46e5 !important;
      color: #ffffff !important;
      border-radius: 9999px !important;
      width: 24px !important;
      height: 24px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin-top: 4px !important;
      margin-right: 4px !important;
      box-shadow: 0 2px 4px -1px rgba(79, 70, 229, 0.3) !important;
    }
    .rbc-day-bg + .rbc-day-bg {
      border-left: 1px solid #f1f5f9 !important;
    }
    .rbc-month-row {
      border-bottom: 1px solid #f1f5f9 !important;
    }
    .rbc-month-row:last-child {
      border-bottom: none !important;
    }
    .rbc-event {
      padding: 2px 8px !important;
      font-size: 0.675rem !important;
      font-weight: 600 !important;
      cursor: pointer !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      margin: 2px 4px !important;
      max-width: calc(100% - 8px) !important;
      box-shadow: none !important;
      text-align: center !important;
      transition: all 0.15s ease !important;
    }
    .rbc-event:hover {
      transform: scale(1.03) !important;
    }
    .rbc-show-more {
      font-weight: 700 !important;
      font-size: 0.7rem !important;
      color: #4f46e5 !important;
      background: none !important;
      cursor: pointer !important;
      padding-left: 4px !important;
    }
    .rbc-off-range-bg {
      background-color: #fafafa !important;
    }
  `;

  return (
    <div className="space-y-6">
      <style>{customCalendarStyles}</style>

      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catatan Perkembangan Harian</h2>
          <p className="text-xs text-slate-500 font-medium">Monitoring perilaku, kegiatan sosial, dan aktivitas motorik harian anak didik</p>
        </div>
        <div className="flex items-center gap-2">

          {user?.role === 'pendamping' && (
            <Link
              to="/daily-reports/add"
              className="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Tulis Catatan Harian</span>
            </Link>
          )}
        </div>
      </div>

      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm flex flex-col sm:flex-row items-center gap-3">
        <div className="flex items-center gap-2 text-slate-400 shrink-0">
          <Filter className="w-4 h-4" />
          <span className="text-xs font-bold uppercase tracking-wider">Filter Siswa:</span>
        </div>
        <select
          value={selectedStudent}
          onChange={handleFilterChange}
          className="w-full sm:w-64 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm cursor-pointer"
        >
          <option value="">Semua Siswa</option>
          {students.map((student) => (
            <option key={student.id} value={student.id}>
              {student.name}
            </option>
          ))}
        </select>

        {viewMode === 'calendar' && (
          <>
            <div className="flex items-center gap-2 text-slate-400 shrink-0 sm:ml-4 border-t sm:border-t-0 sm:border-l border-slate-200/60 pt-3 sm:pt-0 sm:pl-4">
              <CalendarIcon className="w-4 h-4" />
              <span className="text-xs font-bold uppercase tracking-wider">Periode:</span>
            </div>
            <div className="flex gap-2 w-full sm:w-auto">
              <select
                value={currentDate.getMonth()}
                onChange={(e) => {
                  const newMonth = Number(e.target.value);
                  setCurrentDate(new Date(currentDate.getFullYear(), newMonth, 1));
                }}
                className="w-full sm:w-40 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm cursor-pointer"
              >
                <option value={0}>Januari</option>
                <option value={1}>Februari</option>
                <option value={2}>Maret</option>
                <option value={3}>April</option>
                <option value={4}>Mei</option>
                <option value={5}>Juni</option>
                <option value={6}>Juli</option>
                <option value={7}>Agustus</option>
                <option value={8}>September</option>
                <option value={9}>Oktober</option>
                <option value={10}>November</option>
                <option value={11}>Desember</option>
              </select>
              <select
                value={currentDate.getFullYear()}
                onChange={(e) => {
                  const newYear = Number(e.target.value);
                  setCurrentDate(new Date(newYear, currentDate.getMonth(), 1));
                }}
                className="w-full sm:w-32 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm cursor-pointer"
              >
                {Array.from({ length: 11 }, (_, i) => 2024 + i).map(year => (
                  <option key={year} value={year}>{year}</option>
                ))}
              </select>
            </div>
          </>
        )}
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[400px] bg-white border border-slate-200/60 rounded-2xl">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Memuat catatan harian...</span>
          </div>
        </div>
      ) : viewMode === 'calendar' ? (
        /* CALENDAR VIEW */
        <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm overflow-hidden min-h-[550px]">
          <Calendar
            localizer={localizer}
            events={events}
            startAccessor="start"
            endAccessor="end"
            views={['month']}
            defaultView={Views.MONTH}
            date={currentDate}
            onNavigate={(newDate) => setCurrentDate(newDate)}
            selectable
            onSelectEvent={(event) => handleSelectEvent(event as CalendarEvent)}
            onSelectSlot={handleSelectSlot}
            eventPropGetter={eventPropGetter}
            messages={calendarMessages}
            className="min-h-[500px]"
          />
          {user?.role === 'pendamping' && (
            <p className="text-[10px] text-slate-400 font-medium mt-3 italic">
              * Tips: Klik dua kali atau tarik area tanggal kosong pada kalender untuk membuat catatan harian baru untuk tanggal tersebut.
            </p>
          )}
        </div>
      ) : reports.length === 0 ? (
        /* EMPTY LIST STATE */
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Belum ada catatan</h3>
          <p className="text-slate-400 text-xs mt-1">Belum ada laporan harian yang diinput untuk siswa ini.</p>
        </div>
      ) : (
        /* CHRONOLOGICAL LIST FEED VIEW */
        <div className="space-y-6">
          {reports.map((report) => (
            <div key={report.id} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4 hover:border-slate-300 transition-all">
              {/* Report Header */}
              <div className="flex justify-between items-start gap-4 border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-bold text-slate-900 text-sm">{report.student_name}</h4>
                  <span className="text-[11px] font-semibold text-primary-600 block mt-0.5">
                    {formatReportDate(report.date)}
                  </span>
                </div>
                {user?.role === 'pendamping' && (
                  <div className="flex gap-2">
                    <Link
                      to={`/daily-reports/${report.id}/edit`}
                      className="p-1.5 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Edit className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(report.id)}
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              {/* Report Body */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm">
                {report.notes && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Aktivitas Belajar</span>
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">{report.notes}</p>
                  </div>
                )}

                {report.behavior && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Perilaku (Behavior)</span>
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">{report.behavior}</p>
                  </div>
                )}

                {report.social_interaction && (
                  <div className="space-y-1">
                    <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">Interaksi Sosial</span>
                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-line">{report.social_interaction}</p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* DETAIL MODAL OVERLAY */}
      {isModalOpen && selectedReport && (
        <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-in fade-in zoom-in-95 duration-150 overflow-hidden">
            
            {/* Modal Header (Fixed) */}
            <div className="flex items-start justify-between border-b border-slate-100 p-6 pb-4">
              <div>
                <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 rounded-full px-2.5 py-0.5 inline-block">
                  Catatan Harian Siswa
                </span>
                <h3 className="font-extrabold text-slate-800 text-lg mt-1 flex items-center gap-1.5">
                  <User className="w-5 h-5 text-slate-400 shrink-0" />
                  {selectedReport.student_name}
                </h3>
                <span className="text-xs text-slate-500 font-bold block mt-0.5">
                  {formatReportDate(selectedReport.date)}
                </span>
              </div>
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedReport(null);
                }}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-50 rounded-xl transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body (Scrollable) */}
            <div className="flex-1 overflow-y-auto p-6 py-4 space-y-4">
              {/* Aktivitas Belajar */}
              <div className="border border-indigo-100/60 rounded-xl overflow-hidden">
                <div className="bg-indigo-50/50 px-4 py-2 flex items-center gap-2 border-b border-indigo-100/60">
                  <Activity className="w-4 h-4 text-indigo-600" />
                  <span className="text-xs font-bold text-indigo-900 uppercase tracking-wide">Aktivitas Belajar</span>
                </div>
                <div className="p-4 text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedReport.notes || '—'}
                </div>
              </div>

              {/* Perilaku */}
              <div className="border border-amber-100/60 rounded-xl overflow-hidden">
                <div className="bg-amber-50/50 px-4 py-2 flex items-center gap-2 border-b border-amber-100/60">
                  <Smile className="w-4 h-4 text-amber-600" />
                  <span className="text-xs font-bold text-amber-900 uppercase tracking-wide">Perilaku & Emosi</span>
                </div>
                <div className="p-4 text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedReport.behavior || '—'}
                </div>
              </div>

              {/* Interaksi Sosial */}
              <div className="border border-emerald-100/60 rounded-xl overflow-hidden">
                <div className="bg-emerald-50/50 px-4 py-2 flex items-center gap-2 border-b border-emerald-100/60">
                  <Heart className="w-4 h-4 text-emerald-600" />
                  <span className="text-xs font-bold text-emerald-900 uppercase tracking-wide">Interaksi Sosial</span>
                </div>
                <div className="p-4 text-slate-600 font-medium text-sm leading-relaxed whitespace-pre-wrap">
                  {selectedReport.social_interaction || '—'}
                </div>
              </div>

              {/* Foto Dokumentasi */}
              {selectedReport.photos && selectedReport.photos.length > 0 && (
                <div className="border border-purple-100/60 rounded-xl overflow-hidden">
                  <div className="bg-purple-50/50 px-4 py-2 flex items-center gap-2 border-b border-purple-100/60">
                    <ImageIcon className="w-4 h-4 text-purple-600" />
                    <span className="text-xs font-bold text-purple-900 uppercase tracking-wide">Dokumentasi Foto Kegiatan</span>
                  </div>
                  <div className="p-4 bg-slate-50/30">
                    <div className={`grid gap-4 ${
                      selectedReport.photos.length === 1 ? 'grid-cols-1 max-w-md mx-auto' : 'grid-cols-2'
                    }`}>
                      {selectedReport.photos.map((photoUrl, idx) => (
                        <div key={idx} className="aspect-[4/3] rounded-lg overflow-hidden border border-slate-200/60 bg-slate-100 shadow-sm relative group">
                          <img 
                            src={photoUrl} 
                            alt="Dokumentasi harian" 
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-300"
                          />
                          <a 
                            href={photoUrl} 
                            target="_blank" 
                            rel="noreferrer"
                            className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-bold uppercase tracking-wider"
                          >
                            Buka Ukuran Penuh
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer (Fixed) */}
            <div className="border-t border-slate-100 p-6 pt-4 flex items-center justify-end gap-2 bg-slate-50/50">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedReport(null);
                }}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
              >
                Tutup
              </button>
              
              {user?.role === 'pendamping' && (
                <>
                  <button
                    onClick={() => handleDelete(selectedReport.id)}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-rose-50 hover:bg-rose-100 text-rose-600 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Hapus</span>
                  </button>
                  <Link
                    to={`/daily-reports/${selectedReport.id}/edit`}
                    className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl text-xs transition shadow-sm shadow-amber-500/10 cursor-pointer"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit Catatan</span>
                  </Link>
                </>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};
export default DailyReportList;
