import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  ArrowLeft, 
  Save, 
  Loader2, 
  Info,
  Calendar,
  User,
  HeartHandshake
} from 'lucide-react';

interface Teacher {
  id: number;
  name: string;
  email: string;
}

export const StudentForm: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { showToast } = useToast();

  const isEdit = !!id;
  const [name, setName] = useState('');
  const [birthDate, setBirthDate] = useState('');
  const [specialNeeds, setSpecialNeeds] = useState('');
  const [className, setClassName] = useState('');
  const [teacherId, setTeacherId] = useState<number | ''>('');
  
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);

  useEffect(() => {
    const loadFormData = async () => {
      setFetching(true);
      try {
        // Fetch teachers list
        const teachersRes = await fetch('/students/api/teachers');
        if (teachersRes.ok) {
          const teachersData = await teachersRes.json();
          setTeachers(teachersData);
        }

        // Fetch student details if editing
        if (isEdit) {
          const studentRes = await fetch(`/students/api/detail/${id}`);
          if (studentRes.ok) {
            const { student } = await studentRes.json();
            setName(student.name || '');
            setBirthDate(student.birth_date || '');
            setSpecialNeeds(student.special_needs || '');
            setClassName(student.class_name || '');
            setTeacherId(student.teacher_id || '');
          } else {
            showToast('Gagal memuat detail siswa.', 'error');
            navigate('/students');
          }
        }
      } catch (e) {
        showToast('Terjadi kesalahan memuat data.', 'error');
      } finally {
        setFetching(false);
      }
    };

    loadFormData();
  }, [id, isEdit, navigate, showToast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      showToast('Nama siswa wajib diisi!', 'error');
      return;
    }

    setLoading(true);
    try {
      const url = isEdit ? `/students/api/edit/${id}` : '/students/api/add';
      const method = isEdit ? 'PUT' : 'POST';

      const payload = {
        name,
        birth_date: birthDate || null,
        special_needs: specialNeeds || '',
        class_name: className || '',
        teacher_id: teacherId === '' ? null : Number(teacherId)
      };

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        showToast(isEdit ? 'Data siswa berhasil diperbarui!' : 'Siswa baru berhasil ditambahkan!', 'success');
        navigate(isEdit ? `/students/${id}` : '/students');
      } else {
        const err = await res.json();
        showToast(err.detail || 'Gagal menyimpan data.', 'error');
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
          to={isEdit ? `/students/${id}` : "/students"}
          className="p-2 bg-white hover:bg-slate-100 border border-slate-200/80 rounded-xl transition-colors cursor-pointer text-slate-600"
        >
          <ArrowLeft className="w-4 h-4" />
        </Link>
        <div>
          <h2 className="text-xl font-bold text-slate-800">{isEdit ? 'Edit Data Siswa' : 'Tambah Siswa Baru'}</h2>
          <p className="text-xs text-slate-500 font-medium">Isi detail lengkap anak didik untuk mendaftarkannya ke sistem</p>
        </div>
      </div>

      {/* Golden Ratio Grid layout: 61.8% Form (Left), 38.2% Side Info (Right) */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Form: 61.8% */}
        <div className="w-full lg:w-[61.8%]">
          <form onSubmit={handleSubmit} className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-5">
            
            {/* Nama Lengkap */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Nama Lengkap Siswa <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Muhammad Budi"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
                />
              </div>
            </div>

            {/* Tanggal Lahir & Kelas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Tanggal Lahir
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    value={birthDate}
                    onChange={(e) => setBirthDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Kelas / Rombel
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Kelas A1"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
                />
              </div>
            </div>

            {/* Spesifikasi Kebutuhan Khusus */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Spesifikasi Kebutuhan Khusus / Diagnosa BK
              </label>
              <textarea
                placeholder="Contoh: Autisme Ringan, ADHD, Down Syndrome..."
                rows={3}
                value={specialNeeds}
                onChange={(e) => setSpecialNeeds(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
              />
            </div>

            {/* Guru Pendamping */}
            <div>
              <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                Guru Pendamping (Shadow Teacher)
              </label>
              <select
                value={teacherId}
                onChange={(e) => setTeacherId(e.target.value === '' ? '' : Number(e.target.value))}
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm cursor-pointer"
              >
                <option value="">-- Hubungkan dengan Guru Pendamping --</option>
                {teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} ({teacher.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Submit Button */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-end">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                <span>{isEdit ? 'Simpan Perubahan' : 'Simpan Siswa'}</span>
              </button>
            </div>

          </form>
        </div>

        {/* Right Help Column: 38.2% */}
        <div className="w-full lg:w-[38.2%] space-y-6">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-5 shadow-sm space-y-4">
            <div className="flex items-center gap-2 text-primary-600 border-b border-slate-100 pb-3">
              <Info className="w-5 h-5 shrink-0" />
              <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Instruksi Pengisian</h3>
            </div>
            
            <ul className="space-y-3.5 text-xs text-slate-500 font-medium leading-relaxed">
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 mt-1.5"></span>
                <span>Kolom bertanda <span className="text-rose-500 font-bold">*</span> wajib diisi.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 mt-1.5"></span>
                <span><strong>Umur Siswa</strong> akan dihitung secara otomatis berdasarkan tanggal lahir yang dimasukkan.</span>
              </li>
              <li className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary-500 shrink-0 mt-1.5"></span>
                <span>Menghubungkan siswa dengan <strong>Guru Pendamping</strong> akan membatasi otorisasi edit laporan harian dan raport kualitatif hanya untuk guru terkait.</span>
              </li>
            </ul>

            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100 flex gap-3">
              <HeartHandshake className="w-5 h-5 text-accent-500 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-relaxed font-semibold">
                Sistem E-Raport ini dirancang inklusif. Mohon pastikan penulisan diagnosa/kebutuhan khusus ditulis secara profesional demi privasi anak didik.
              </p>
            </div>
          </div>
        </div>

      </div>

    </div>
  );
};
