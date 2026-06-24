import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { AssessmentForm } from './AssessmentForm';
import { 
  FileText, 
  PlusCircle, 
  Eye, 
  Edit, 
  Trash2, 
  Printer, 
  Loader2, 
  Filter 
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
}

interface Assessment {
  id: number;
  student_id: number;
  student_name: string;
  period: string;
  motoric: string;
  language: string;
  social: string;
  cognitive: string;
  independence: string;
  summary: string;
  created_at: string;
}

export const AssessmentList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [searchParams, setSearchParams] = useSearchParams();

  const isAdmin = user?.role === 'admin';
  const isShadowTeacher = user?.role === 'pendamping';
  const canManage = isAdmin || isShadowTeacher;
  
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  const [loading, setLoading] = useState(true);

  // Modal states
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedAssessmentId, setSelectedAssessmentId] = useState<number | null>(null);
  const [preselectedStudentId, setPreselectedStudentId] = useState<number | null>(null);

  useEffect(() => {
    const addParam = searchParams.get('add');
    const studentIdParam = searchParams.get('student_id');
    if (addParam === 'true') {
      setIsFormOpen(true);
      if (studentIdParam) {
        setPreselectedStudentId(Number(studentIdParam));
      }
      setSearchParams({}, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchAssessments = async (studentId: number | '' = '') => {
    setLoading(true);
    try {
      const url = studentId ? `/assessments/api/list?student_id=${studentId}` : '/assessments/api/list';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setAssessments(data);
      } else {
        showToast('Gagal memuat raport kualitatif.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFiltersAndAssessments = async () => {
      try {
        const studentsRes = await fetch('/students/api/list');
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
      } catch (e) {
        // Ignored
      }
      fetchAssessments();
    };

    loadFiltersAndAssessments();
  }, [showToast]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    setSelectedStudent(val);
    fetchAssessments(val);
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus raport kualitatif ini?')) {
      return;
    }

    try {
      const res = await fetch(`/assessments/api/delete/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Raport kualitatif berhasil dihapus!', 'success');
        setAssessments(prev => prev.filter(a => a.id !== id));
      } else {
        const err = await res.json();
        showToast(err.detail || 'Gagal menghapus raport.', 'error');
      }
    } catch (e) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  const formatCreateDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
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
          <h2 className="text-xl font-bold text-slate-800">Riwayat Raport Kualitatif</h2>
          <p className="text-xs text-slate-500 font-medium">Asesmen narasi berkas perkembangan kualitatif aspek perkembangan anak berkebutuhan khusus</p>
        </div>
        {isShadowTeacher && (
          <button
            onClick={() => {
              setSelectedAssessmentId(null);
              setPreselectedStudentId(null);
              setIsFormOpen(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer font-medium"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Buat Raport Kualitatif</span>
          </button>
        )}
      </div>

      {/* Filter */}
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

      {/* List of Assessments */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Memuat riwayat raport kualitatif...</span>
          </div>
        </div>
      ) : assessments.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Belum ada raport kualitatif</h3>
          <p className="text-slate-400 text-xs mt-1">Belum ada dokumen penilaian kualitatif yang diinput untuk siswa ini.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {assessments.map((assess) => (
            <div key={assess.id} className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm hover:border-slate-300 transition-all flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="font-bold text-slate-900 text-sm">{assess.student_name}</h4>
                  <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded text-[10px] font-bold">
                    {assess.period}
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-semibold mt-1">
                  Diterbitkan pada: {formatCreateDate(assess.created_at)}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Link
                  to={`/reports/${assess.student_id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>Lihat Laporan</span>
                </Link>
                <a
                  href={`/reports/${assess.student_id}/print`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-bold transition-all cursor-pointer shadow-sm"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Cetak PDF</span>
                </a>
                {isShadowTeacher && (
                  <>
                    <button
                      onClick={() => {
                        setSelectedAssessmentId(assess.id);
                        setPreselectedStudentId(null);
                        setIsFormOpen(true);
                      }}
                      className="p-2 bg-amber-50 hover:bg-amber-100 text-amber-600 rounded-lg transition-colors cursor-pointer"
                      title="Edit Raport"
                    >
                      <Edit className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => handleDelete(assess.id)}
                      className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                      title="Hapus Raport"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
      <AssessmentForm
        isOpen={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setSelectedAssessmentId(null);
          setPreselectedStudentId(null);
        }}
        onSuccess={() => {
          fetchAssessments(selectedStudent);
        }}
        assessmentId={selectedAssessmentId}
        initialStudentId={preselectedStudentId}
      />
    </div>
  );
};
