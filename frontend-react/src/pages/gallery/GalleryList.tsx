import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Image as ImageIcon, 
  Upload, 
  Trash2, 
  Loader2, 
  Filter,
  Calendar,
  Users,
  FileText,
  X
} from 'lucide-react';

interface Student {
  id: number;
  name: string;
}

interface GalleryItem {
  id: number;
  student_id: number;
  student_name: string;
  image_path: string;
  description: string;
  domain: string;
  date: string;
}

export const GalleryList: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();
  
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<number | ''>('');
  
  // Upload states
  const [uploadStudentId, setUploadStudentId] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [activityDate, setActivityDate] = useState(new Date().toISOString().split('T')[0]);
  const [file, setFile] = useState<File | null>(null);

  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsModalOpen(false);
      }
    };
    if (isModalOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isModalOpen]);

  const fetchGallery = async (studentId: number | '' = '') => {
    setLoading(true);
    try {
      const url = studentId ? `/gallery/api/list?student_id=${studentId}` : '/gallery/api/list';
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setItems(data);
      } else {
        showToast('Gagal memuat galeri kegiatan.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadFiltersAndGallery = async () => {
      try {
        const studentsRes = await fetch('/students/api/list');
        if (studentsRes.ok) {
          const studentsData = await studentsRes.json();
          setStudents(studentsData);
        }
      } catch (e) {
        // Ignored
      }
      fetchGallery();
    };

    loadFiltersAndGallery();
  }, [showToast]);

  const handleFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value === '' ? '' : Number(e.target.value);
    setSelectedStudent(val);
    fetchGallery(val);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
    }
  };

  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!uploadStudentId) {
      showToast('Pilih nama siswa!', 'error');
      return;
    }
    if (!file) {
      showToast('Pilih berkas foto kegiatan!', 'error');
      return;
    }
    if (!activityDate) {
      showToast('Pilih tanggal kegiatan!', 'error');
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('student_id', String(uploadStudentId));
      formData.append('description', description);
      formData.append('domain', '');
      formData.append('activity_date', activityDate);
      formData.append('image', file);

      const res = await fetch('/gallery/api/upload', {
        method: 'POST',
        body: formData // Form-data headers are automatically computed
      });

      if (res.ok) {
        showToast('Foto kegiatan berhasil diunggah!', 'success');
        
        // Reset upload fields
        setUploadStudentId('');
        setDescription('');
        setFile(null);
        // Clear input element
        const fileInput = document.getElementById('image-upload-input') as HTMLInputElement;
        if (fileInput) fileInput.value = '';

        setIsModalOpen(false);
        fetchGallery(selectedStudent);
      } else {
        const err = await res.json();
        showToast(err.detail || 'Gagal mengunggah foto.', 'error');
      }
    } catch (err) {
      showToast('Gagal terhubung ke server.', 'error');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Apakah Anda yakin ingin menghapus foto kegiatan ini?')) {
      return;
    }

    try {
      const res = await fetch(`/gallery/api/delete/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        showToast('Foto kegiatan berhasil dihapus!', 'success');
        setItems(prev => prev.filter(item => item.id !== id));
      } else {
        const err = await res.json();
        showToast(err.detail || 'Gagal menghapus foto.', 'error');
      }
    } catch (e) {
      showToast('Gagal terhubung ke server.', 'error');
    }
  };

  const formatItemDate = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const isAdmin = user?.role === 'admin';
  const isShadowTeacher = user?.role === 'pendamping';
  const canUpload = isShadowTeacher;
  const canDelete = isAdmin || isShadowTeacher;

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Galeri Kegiatan Siswa</h2>
          <p className="text-xs text-slate-500 font-medium">Dokumentasi portofolio visual kegiatan belajar inklusif sehari-hari</p>
        </div>
        {canUpload && (
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer font-medium"
          >
            <Upload className="w-4 h-4" />
            <span>Unggah Foto Baru</span>
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

      {/* Photos Grid Area */}
      <div className="w-full">
        {loading ? (
          <div className="flex items-center justify-center min-h-[300px]">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-primary animate-spin" />
              <span className="text-sm text-slate-500 font-medium">Memuat galeri...</span>
            </div>
          </div>
        ) : items.length === 0 ? (
          <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
              <ImageIcon className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-700 text-sm">Galeri kosong</h3>
            <p className="text-slate-400 text-xs mt-1">Belum ada foto dokumentasi kegiatan yang diunggah.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-white border border-slate-200/60 rounded-2xl overflow-hidden shadow-sm hover:shadow transition-all group flex flex-col">
                <div className="aspect-[4/3] bg-slate-100 relative overflow-hidden">
                  <img 
                    src={item.image_path} 
                    alt={item.description} 
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Body Info */}
                <div className="p-4 flex-1 flex flex-col justify-between space-y-2">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                      <span>{item.student_name}</span>
                      <span>{formatItemDate(item.date)}</span>
                    </div>
                    <p className="text-xs text-slate-600 font-medium leading-relaxed line-clamp-2">
                      {item.description || 'Dokumentasi pembelajaran'}
                    </p>
                  </div>
                  {canDelete && (
                    <div className="pt-2 border-t border-slate-50 flex justify-end">
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 rounded-lg transition-colors cursor-pointer"
                        title="Hapus Foto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Upload Modal (Popup) */}
      {canUpload && isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop Overlay */}
          <div 
            className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm transition-opacity cursor-pointer"
            onClick={() => setIsModalOpen(false)}
          />

          {/* Modal Container */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-xl w-full max-w-md z-10 relative transform transition-all max-h-[90vh] overflow-y-auto">
            {/* Close Button */}
            <button
              onClick={() => setIsModalOpen(false)}
              className="absolute top-4 right-4 p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
              title="Tutup"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Upload Form */}
            <form onSubmit={handleUploadSubmit} className="space-y-5">
              <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
                <Upload className="w-5 h-5 text-primary-500" />
                <h3 className="font-bold text-slate-800 text-sm tracking-wide uppercase">Unggah Foto Baru</h3>
              </div>

              {/* Student */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Nama Siswa <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Users className="absolute left-4 top-3 w-4 h-4 text-slate-400 z-10" />
                  <select
                    value={uploadStudentId}
                    onChange={(e) => setUploadStudentId(e.target.value === '' ? '' : Number(e.target.value))}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm cursor-pointer"
                  >
                    <option value="">-- Pilih Siswa --</option>
                    {students.map((student) => (
                      <option key={student.id} value={student.id}>
                        {student.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Tanggal <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-4 top-3 w-4 h-4 text-slate-400" />
                  <input
                    type="date"
                    required
                    value={activityDate}
                    onChange={(e) => setActivityDate(e.target.value)}
                    className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-xs sm:text-sm"
                  />
                </div>
              </div>

              {/* File Image */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Berkas Foto (JPG/PNG) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="file"
                  id="image-upload-input"
                  required
                  accept="image/*"
                  onChange={handleFileChange}
                  className="w-full text-xs text-slate-500 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary-50 file:text-primary-700 file:cursor-pointer hover:file:bg-primary-100 transition-all"
                />
              </div>

              {/* Description */}
              <div>
                <label className="block text-xs font-bold text-slate-600 uppercase tracking-wider mb-2">
                  Keterangan / Keterangan Foto
                </label>
                <textarea
                  placeholder="Contoh: Menggambar menggunakan kuas kecil untuk melatih motorik halus..."
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm resize-none"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={uploading}
                className="w-full py-3 bg-gradient-to-r from-primary-600 to-primary-700 hover:from-primary-700 hover:to-primary-800 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer flex items-center justify-center gap-2 disabled:opacity-75 disabled:cursor-not-allowed"
              >
                {uploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Mengunggah...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Unggah Dokumentasi</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
