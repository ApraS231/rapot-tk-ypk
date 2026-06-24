import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  Printer, 
  Search, 
  Loader2, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  ChevronRight, 
  User 
} from 'lucide-react';

interface ReportStudent {
  student_id: number;
  student_name: string;
  class_name: string | null;
  special_needs: string | null;
  teacher_name: string;
  assessments_count: number;
}

export const ReportIndex: React.FC = () => {
  const { showToast } = useToast();
  const [students, setStudents] = useState<ReportStudent[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchReportsData = async () => {
    try {
      const res = await fetch('/api/reports');
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else {
        showToast('Gagal memuat data kesiapan laporan.', 'error');
      }
    } catch (err) {
      showToast('Koneksi internet bermasalah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportsData();
  }, [showToast]);

  const filteredStudents = students.filter(s => 
    s.student_name.toLowerCase().includes(search.toLowerCase()) ||
    (s.class_name && s.class_name.toLowerCase().includes(search.toLowerCase())) ||
    (s.special_needs && s.special_needs.toLowerCase().includes(search.toLowerCase())) ||
    s.teacher_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Cetak Raport Perkembangan</h2>
        <p className="text-xs text-slate-500 font-medium">Kompilasi otomatis catatan perkembangan kualitatif dan indeks kuantitatif BK dalam format A4 siap cetak</p>
      </div>

      {/* Filter / Search Panel */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari nama siswa, kelas, diagnosa, atau guru pendamping..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
          />
        </div>
      </div>

      {/* Main Content Area */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Memuat data kesiapan raport...</span>
          </div>
        </div>
      ) : filteredStudents.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Tidak ada data siswa</h3>
          <p className="text-slate-400 text-xs mt-1">Cari dengan kata kunci lain atau hubungi Administrator.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredStudents.map((student) => {
            const isReady = student.assessments_count > 0;
            return (
              <div 
                key={student.student_id} 
                className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-slate-350 transition-all flex flex-col justify-between"
              >
                <div>
                  {/* Status Indicator */}
                  <div className="flex justify-between items-start mb-3">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">ID Siswa: #{student.student_id}</span>
                    {isReady ? (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-green-50 text-green-700 border border-green-200">
                        <CheckCircle2 className="w-3 h-3" />
                        <span>Siap Cetak</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                        <AlertTriangle className="w-3 h-3" />
                        <span>Raport Kosong</span>
                      </span>
                    )}
                  </div>

                  {/* Student Name & Basic Info */}
                  <h3 className="font-extrabold text-slate-800 text-base leading-snug">{student.student_name}</h3>
                  
                  <div className="mt-3 space-y-2 text-xs font-semibold text-slate-600">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kelas:</span>
                      <span className="text-slate-700">{student.class_name || '—'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Kekhususan:</span>
                      <span className="text-slate-700 max-w-[150px] truncate" title={student.special_needs || ''}>
                        {student.special_needs || '—'}
                      </span>
                    </div>
                    <div className="flex justify-between border-t border-slate-50 pt-2">
                      <span className="text-slate-400">Guru Pendamping:</span>
                      <span className="text-slate-700 truncate max-w-[150px]">{student.teacher_name}</span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="mt-5 pt-4 border-t border-slate-150 flex items-center justify-between">
                  <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {student.assessments_count} Asesmen Kualitatif
                  </div>
                  
                  {isReady ? (
                    <Link
                      to={`/reports/${student.student_id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-xl text-xs font-bold transition shadow-sm hover:shadow shadow-primary-500/10"
                    >
                      <span>Lihat Raport</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  ) : (
                    <Link
                      to="/assessments/add"
                      className="inline-flex items-center gap-1.5 px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-xl text-xs font-bold transition"
                    >
                      <span>Buat Asesmen</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
export default ReportIndex;
