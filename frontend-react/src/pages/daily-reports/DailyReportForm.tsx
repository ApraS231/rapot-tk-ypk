import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link, useSearchParams } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Info,
  Calendar,
  Users,
  Activity,
  Smile,
  Heart
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
}

export const DailyReportForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEdit = !!id;
  const preselectStudentId = searchParams.get('student_id');

  const [studentId, setStudentId] = useState<number | ''>('');
  const [reportDate, setReportDate] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [behavior, setBehavior] = useState('');
  const [socialInteraction, setSocialInteraction] = useState('');

  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const loadForm = async () => {
      setFetching(true);
      try {
        const studentsRes = await fetch('/students/api/list');
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
          
          if (preselectStudentId) {
            setStudentId(Number(preselectStudentId));
          }
        }

        if (isEdit) {
          const res = await fetch(`/daily-reports/api/detail/${id}`);
          if (res.ok) {
            const data = await res.json();
            setStudentId(data.student_id || '');
            setReportDate(data.date || '');
            setNotes(data.notes || '');
            setBehavior(data.behavior || '');
            setSocialInteraction(data.social_interaction || '');
          } else {
            showToast('Laporan harian tidak ditemukan.', 'error');
            navigate('/daily-reports');
          }
        }
      } catch (e) {
        showToast('Terjadi kesalahan memuat data.', 'error');
      } finally {
        setFetching(false);
      }
    };

    loadForm();
  }, [id, isEdit, preselectStudentId, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!studentId) {
      showToast('Pilih siswa terlebih dahulu!', 'error');
      return;
    }

    if (!reportDate) {
      showToast('Pilih tanggal laporan!', 'error');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/daily-reports/api/edit/${id}` : '/daily-reports/api/add';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        student_id: Number(studentId),
        date: reportDate,
        notes: notes || '',
        behavior: behavior || '',
        social_interaction: socialInteraction || ''
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEdit ? 'Catatan harian berhasil diperbarui!' : 'Catatan harian berhasil disimpan!', 'success');
        navigate(`/students/${studentId}`);
      } else {
        const err = await res.json();
        showToast(err.detail || 'Gagal menyimpan catatan harian.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (fetching) {
    return (
      <div className="flex-grow flex items-center justify-center min-h-[400px]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 text-primary animate-spin" />
          <span className="text-sm text-slate-500 font-medium">Memuat formulir...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Link 
          to="/daily-reports"
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors cursor-pointer text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Catatan Harian' : 'Tulis Catatan Harian'}</h2>
          <p className="text-xs text-slate-500 font-medium">Dokumentasikan aktivitas belajar dan perilaku khusus anak hari ini</p>
        </div>
      </div>

      {/* Golden Ratio Grid layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Form: 61.8% */}
        <div className="w-full lg:w-[61.8%]">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            
            {/* Siswa & Tanggal */}
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
                    onChange={(e) => setStudentId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
                  >
                    <option value="">-- Pilih Siswa Dampingan --</option>
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
                  Tanggal Laporan <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={reportDate}
                    onChange={(e) => setReportDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Aktivitas Belajar */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Aktivitas Belajar & Kegiatan Utama
              </label>
              <textarea
                placeholder="Deskripsikan apa yang dipelajari hari ini, respons terhadap materi, dan materi yang diselesaikan..."
                rows={4}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
              />
            </div>

            {/* Perilaku (Behavior) */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Perilaku & Emosi (Behavioral Feed)
              </label>
              <textarea
                placeholder="Catat kondisi emosional anak, tantrum (jika ada), kefokusan belajar, atau perilaku repetitif yang muncul..."
                rows={3}
                value={behavior}
                onChange={(e) => setBehavior(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
              />
            </div>

            {/* Interaksi Sosial */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Interaksi Sosial
              </label>
              <textarea
                placeholder="Bagaimana hubungan anak hari ini dengan teman sebaya, guru kelas, atau pendamping? Apakah mau berbagi/bermain bersama?..."
                rows={3}
                value={socialInteraction}
                onChange={(e) => setSocialInteraction(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
              />
            </div>

            {/* Submit Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Laporan'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right Instructions Column: 38.2% */}
        <div className="w-full lg:w-[38.2%] space-y-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary-600 border-b border-slate-100 pb-3">
              <Info className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Panduan Penulisan</h3>
            </div>
            
            <div className="space-y-4 text-xs text-slate-500 font-medium leading-relaxed">
              <div className="flex gap-2.5">
                <Activity className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-700 mb-0.5">Aktivitas Belajar</h5>
                  <span>Deskripsikan kemajuan sensorik-motorik atau kesiapan akademis anak selama di kelas.</span>
                </div>
              </div>
              
              <div className="flex gap-2.5">
                <Smile className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-700 mb-0.5">Perilaku (Behavior)</h5>
                  <span>Gunakan istilah deskriptif netral (contoh: "menolak kontak mata selama 10 menit" alih-alih "tidak sopan").</span>
                </div>
              </div>

              <div className="flex gap-2.5">
                <Heart className="w-4 h-4 text-slate-400 shrink-0 mt-0.5" />
                <div>
                  <h5 className="font-bold text-slate-700 mb-0.5">Interaksi Sosial</h5>
                  <span>Catat respon anak saat diajak berkomunikasi secara interaktif.</span>
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
