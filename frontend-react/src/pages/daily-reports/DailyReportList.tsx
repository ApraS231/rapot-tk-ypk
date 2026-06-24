import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  ClipboardList, 
  PlusCircle, 
  Edit, 
  Trash2, 
  Loader2, 
  Filter 
} from 'lucide-react';

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
}

export const DailyReportList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [reports, setReports] = useState<Report[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Catatan Perkembangan Harian</h2>
          <p className="text-xs text-slate-500 font-medium">Monitoring perilaku, kegiatan sosial, dan aktivitas motorik harian anak didik</p>
        </div>
        {user?.role === 'pendamping' && (
          <Link
            to="/daily-reports/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Tulis Catatan Harian</span>
          </Link>
        )}
      </div>

      {/* Filters */}
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
      </div>

      {/* Reports Feed */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Memuat catatan harian...</span>
          </div>
        </div>
      ) : reports.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Belum ada catatan</h3>
          <p className="text-slate-400 text-xs mt-1">Belum ada laporan harian yang diinput untuk siswa ini.</p>
        </div>
      ) : (
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
    </div>
  );
};
