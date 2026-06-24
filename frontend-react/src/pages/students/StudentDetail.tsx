import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, 
  Edit, 
  Calendar, 
  Briefcase, 
  HeartPulse, 
  User, 
  BookOpen, 
  FileText, 
  Image as ImageIcon, 
  Printer, 
  PlusCircle,
  Eye,
  Loader2
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
  age: number;
  birth_date: string;
  special_needs: string;
  class_name: string;
  teacher_id: number;
  teacher_name: string;
}

interface Report {
  id: number;
  date: string;
  notes: string;
  behavior: string;
  social_interaction: string;
}

interface Assessment {
  id: number;
  period: string;
  motoric: string;
  language: string;
  social_emotional: string;
  cognitive: string;
  independence: string;
  summary: string;
  created_at: string;
}

interface GalleryItem {
  id: number;
  image_path: string;
  description: string;
  date: string;
}

interface DetailData {
  student: Student;
  recent_reports: Report[];
  assessments: Assessment[];
  gallery_items: GalleryItem[];
}

export const StudentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();

  const [data, setData] = useState<DetailData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const res = await fetch(`/students/api/detail/${id}`);
        if (res.ok) {
          const detailData = await res.json();
          setData(detailData);
        } else {
          showToast('Siswa tidak ditemukan atau Anda tidak memiliki akses.', 'error');
          navigate('/students');
        }
      } catch (err) {
        showToast('Kesalahan koneksi ke server.', 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchDetail();
  }, [id, navigate, showToast]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Memuat detail siswa...</span>
        </div>
      </div>
    );
  }

  if (!data) return null;

  const { student, recent_reports, assessments, gallery_items } = data;

  const formatBirthDate = (dateStr: string) => {
    if (!dateStr) return 'Belum ditentukan';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
  };

  const formatReportDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      weekday: 'long',
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <Link 
            to="/students" 
            className="p-2 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors cursor-pointer text-slate-600"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h2 className="text-xl font-bold text-slate-800">{student.name}</h2>
            <p className="text-xs text-slate-500 font-medium">Informasi perkembangan dan portofolio anak didik</p>
          </div>
        </div>
        
        {user?.role === 'admin' && (
          <Link
            to={`/students/${student.id}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-100 text-slate-700 font-semibold rounded-xl text-sm border border-slate-200 transition-all cursor-pointer"
          >
            <Edit className="w-4 h-4 text-slate-500" />
            <span>Edit Profil</span>
          </Link>
        )}
      </div>

      {/* Golden Ratio Grid layout: 61.8% Main (Left), 38.2% Gallery/Actions (Right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* 📐 Main Area (Left Column - 61.8% width on desktop) */}
        <div className="w-full lg:w-[61.8%] space-y-6">
          
          {/* Profile Card */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase mb-4 pb-2 border-b border-slate-100">
              Profil Dasar
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="flex items-start gap-3">
                <Calendar className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Lahir & Umur</span>
                  <span className="block text-slate-800 text-sm font-semibold mt-0.5">
                    {formatBirthDate(student.birth_date)} ({student.age} Tahun)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Briefcase className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Rombongan Belajar (Kelas)</span>
                  <span className="block text-slate-800 text-sm font-semibold mt-0.5">
                    {student.class_name || 'Belum ditentukan'}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <User className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Guru Pendamping (Shadow)</span>
                  <span className="block text-slate-800 text-sm font-semibold mt-0.5">
                    {student.teacher_name}
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <HeartPulse className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <span className="block text-[10px] font-bold text-slate-400 uppercase tracking-wide">Kebutuhan Khusus</span>
                  <span className="block text-slate-800 text-sm font-semibold mt-0.5">
                    {student.special_needs || '-'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Daily Reports */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Laporan Harian Terbaru</h3>
              </div>
              {user?.role === 'pendamping' && (
                <Link to={`/daily-reports/add?student_id=${student.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> Tulis Catatan
                </Link>
              )}
            </div>

            {recent_reports.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                Belum ada catatan laporan harian untuk siswa ini.
              </div>
            ) : (
              <div className="space-y-4">
                {recent_reports.map((report) => (
                  <div key={report.id} className="p-4 bg-slate-50 rounded-xl border border-slate-100 space-y-2">
                    <div className="font-bold text-xs text-primary-600">{formatReportDate(report.date)}</div>
                    
                    {report.notes && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Aktivitas</span>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">{report.notes}</p>
                      </div>
                    )}
                    
                    {report.behavior && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Perilaku (Behavior)</span>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">{report.behavior}</p>
                      </div>
                    )}

                    {report.social_interaction && (
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Interaksi Sosial</span>
                        <p className="text-xs text-slate-600 mt-0.5 font-medium leading-relaxed">{report.social_interaction}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Qualitative Assessments */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-accent-500" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Riwayat Raport Kualitatif</h3>
              </div>
              {user?.role === 'pendamping' && (
                <Link to={`/assessments?add=true&student_id=${student.id}`} className="text-primary-600 hover:text-primary-700 text-xs font-bold flex items-center gap-1">
                  <PlusCircle className="w-3.5 h-3.5" /> Buat Raport
                </Link>
              )}
            </div>

            {assessments.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                Belum ada evaluasi kualitatif yang diterbitkan untuk siswa ini.
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {assessments.map((assess) => (
                  <div key={assess.id} className="py-4 first:pt-0 last:pb-0 flex items-center justify-between gap-4">
                    <div>
                      <div className="font-bold text-slate-800 text-sm">{assess.period}</div>
                      <div className="text-[10px] text-slate-400 font-semibold mt-1">
                        Dibuat pada: {new Date(assess.created_at).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link 
                        to={`/reports/${student.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Lihat Laporan</span>
                      </Link>
                      <a 
                        href={`/reports/${student.id}`} 
                        target="_blank" 
                        rel="noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary-50 hover:bg-primary-100 text-primary-700 rounded-lg text-xs font-bold transition-colors cursor-pointer"
                      >
                        <Printer className="w-3.5 h-3.5" />
                        <span>Cetak PDF</span>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 📐 Side Panel (Right Column - 38.2% width on desktop) */}
        <div className="w-full lg:w-[38.2%] space-y-6">
          
          {/* Photo Gallery preview */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-slate-400" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Galeri Kegiatan</h3>
              </div>
              <Link to="/gallery" className="text-primary-600 hover:text-primary-700 text-xs font-bold">
                Lihat Semua
              </Link>
            </div>

            {gallery_items.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs font-medium">
                Belum ada dokumentasi foto kegiatan.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {gallery_items.map((item) => (
                  <div key={item.id} className="group relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img 
                      src={item.image_path} 
                      alt={item.description} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200" 
                    />
                    <div className="absolute inset-0 bg-slate-900/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-[10px] text-white">
                      <p className="line-clamp-2 leading-tight font-medium">{item.description || 'Kegiatan siswa'}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Seeding & Evaluation BK quick access (Admin only) */}
          {user?.role === 'admin' && (
            <div className="bg-gradient-to-r from-accent-500 to-amber-600 text-white rounded-2xl p-5 shadow-lg shadow-amber-500/10 space-y-3">
              <h4 className="font-bold text-sm tracking-wide uppercase">Evaluasi BK Kuantitatif</h4>
              <p className="text-[11px] text-amber-50 leading-relaxed font-semibold">
                Anak ini belum dianalisis grafiknya? Lakukan pengukuran instrumen BK (Kognitif, Motorik, Bahasa, Sosial, Mandiri) untuk menghasilkan grafik perkembangan.
              </p>
              <Link 
                to={`/evaluations/add?student_id=${student.id}`} 
                className="w-full inline-flex items-center justify-center gap-1.5 py-2 bg-white hover:bg-amber-50 text-amber-700 font-bold rounded-xl text-xs shadow transition-colors cursor-pointer"
              >
                <span>Input Hasil BK</span>
              </Link>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};
