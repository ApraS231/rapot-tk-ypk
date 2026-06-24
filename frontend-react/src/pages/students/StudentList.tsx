import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Search, 
  UserPlus, 
  Eye, 
  Edit, 
  Trash2, 
  Loader2, 
  User, 
  ShieldAlert 
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

export const StudentList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchStudents = async (query: string = '') => {
    setLoading(true);
    try {
      const url = query ? `/students/api/list?q=${encodeURIComponent(query)}` : '/students/api/list';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStudents(data);
      } else {
        showToast('Gagal memuat daftar siswa.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, [showToast]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchStudents(search);
  };

  const handleDelete = async (id: number, name: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data siswa "${name}"? Semua laporan, galeri, dan penilaian terkait siswa ini juga akan dihapus secara permanen.`)) {
      return;
    }

    try {
      const res = await fetch(`/students/api/delete/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Data siswa berhasil dihapus!', 'success');
        setStudents(prev => prev.filter(s => s.id !== id));
      } else {
        const errData = await res.json();
        showToast(errData.detail || 'Gagal menghapus siswa.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Daftar Siswa</h2>
          <p className="text-xs text-slate-500 font-medium">Kelola biodata, guru pendamping, dan informasi medis anak</p>
        </div>
        {user?.role === 'admin' && (
          <Link
            to="/students/add"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <UserPlus className="w-4 h-4" />
            <span>Tambah Siswa</span>
          </Link>
        )}
      </div>

      {/* Filter / Search Panel */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
        <form onSubmit={handleSearchSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Cari nama siswa..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
            />
          </div>
          <button
            type="submit"
            className="px-5 py-2.5 bg-slate-800 hover:bg-slate-900 text-white font-semibold rounded-xl text-sm transition-colors cursor-pointer"
          >
            Cari
          </button>
        </form>
      </div>

      {/* Data Table / Cards */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Memuat data siswa...</span>
          </div>
        </div>
      ) : students.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <User className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Tidak ada data siswa</h3>
          <p className="text-slate-400 text-xs mt-1">Coba bersihkan pencarian atau hubungi Administrator.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Nama Siswa</th>
                  <th className="px-6 py-4">Umur</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Guru Pendamping (Shadow)</th>
                  <th className="px-6 py-4">Kebutuhan Khusus</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {students.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{student.name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID: #{student.id}</div>
                    </td>
                    <td className="px-6 py-4">{student.age} Tahun</td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        {student.class_name || 'Belum ditentukan'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {student.teacher_name}
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-normal">
                      {student.special_needs || '-'}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/students/${student.id}`}
                          title="Lihat Detail"
                          className="p-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        {user?.role === 'admin' && (
                          <>
                            <Link
                              to={`/students/${student.id}/edit`}
                              title="Edit Siswa"
                              className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Edit className="w-4 h-4" />
                            </Link>
                            <button
                              onClick={() => handleDelete(student.id, student.name)}
                              title="Hapus Siswa"
                              className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
