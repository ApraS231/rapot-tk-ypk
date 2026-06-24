import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { 
  Plus, 
  Trash2, 
  TrendingUp, 
  Search, 
  Loader2, 
  ClipboardList, 
  AlertCircle 
} from 'lucide-react';

interface Evaluation {
  id: number;
  student_id: number;
  student_name: string;
  date: string | null;
  class_name: string | null;
  diagnosa: string | null;
  composite_index: number;
  index_percentage: number;
  predicate: 'BSB' | 'BSH' | 'MB' | 'BB';
}

export const EvaluationList: React.FC = () => {
  const { showToast } = useToast();
  const [evaluations, setEvaluations] = useState<Evaluation[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchEvaluations = async () => {
    setLoading(true);
    try {
      const res = await fetch('/evaluations/api/list');
      if (res.ok) {
        const data = await res.json();
        setEvaluations(data);
      } else {
        showToast('Gagal memuat data riwayat nilai.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvaluations();
  }, [showToast]);

  const handleDelete = async (id: number, studentName: string) => {
    if (!window.confirm(`Apakah Anda yakin ingin menghapus data penilaian untuk "${studentName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/evaluations/api/delete/${id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        showToast('Penilaian berhasil dihapus.', 'success');
        setEvaluations(prev => prev.filter(ev => ev.id !== id));
      } else {
        const data = await res.json();
        showToast(data.detail || 'Gagal menghapus penilaian.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    }
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return '—';
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (e) {
      return dateStr;
    }
  };

  const filteredEvaluations = evaluations.filter(ev => 
    ev.student_name.toLowerCase().includes(search.toLowerCase()) ||
    (ev.class_name && ev.class_name.toLowerCase().includes(search.toLowerCase())) ||
    (ev.diagnosa && ev.diagnosa.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Riwayat Penilaian Kuantitatif BK</h2>
          <p className="text-xs text-slate-500 font-medium">Monitoring nilai komposit, persentase indeks perkembangan, dan grafik tren siswa</p>
        </div>
        <Link
          to="/evaluations/add"
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-primary-600 hover:bg-primary-700 text-white font-semibold rounded-xl text-sm shadow-md shadow-primary-500/10 hover:shadow-primary-600/20 transform hover:-translate-y-0.5 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Input Penilaian</span>
        </Link>
      </div>

      {/* Filter / Search Panel */}
      <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari berdasarkan nama siswa, kelas, atau diagnosa..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
          />
        </div>
      </div>

      {/* Data Table */}
      {loading ? (
        <div className="flex items-center justify-center min-h-[300px]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <span className="text-sm text-slate-500 font-medium">Memuat riwayat penilaian...</span>
          </div>
        </div>
      ) : filteredEvaluations.length === 0 ? (
        <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ClipboardList className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-slate-700 text-sm">Tidak ada riwayat penilaian</h3>
          <p className="text-slate-400 text-xs mt-1">Coba sesuaikan pencarian Anda atau buat penilaian baru.</p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                  <th className="px-6 py-4">Siswa</th>
                  <th className="px-6 py-4">Tanggal</th>
                  <th className="px-6 py-4">Kelas</th>
                  <th className="px-6 py-4">Diagnosa (Kebutuhan Khusus)</th>
                  <th className="px-6 py-4 text-center">Indeks Komposit</th>
                  <th className="px-6 py-4 text-center">Persentase</th>
                  <th className="px-6 py-4 text-center">Predikat</th>
                  <th className="px-6 py-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {filteredEvaluations.map((ev) => (
                  <tr key={ev.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-900">{ev.student_name}</div>
                      <div className="text-xs text-slate-400 mt-0.5">ID Siswa: #{ev.student_id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {formatDate(ev.date)}
                    </td>
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-semibold">
                        {ev.class_name || '—'}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-slate-500 font-normal">
                      {ev.diagnosa || '—'}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-slate-800">
                      {ev.composite_index.toFixed(2)}
                    </td>
                    <td className="px-6 py-4 text-center font-bold text-primary-600">
                      {ev.index_percentage}%
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className={`inline-flex px-2.5 py-1 rounded-full text-xs font-bold ${
                        ev.predicate === 'BSB' ? 'bg-green-50 text-green-700 border border-green-200' :
                        ev.predicate === 'BSH' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                        ev.predicate === 'MB' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {ev.predicate}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          to={`/evaluations/rekap?student_id=${ev.student_id}`}
                          title="Lihat Tren & Rekap"
                          className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer text-xs font-semibold"
                        >
                          <TrendingUp className="w-3.5 h-3.5" />
                          <span>Tren</span>
                        </Link>
                        <button
                          onClick={() => handleDelete(ev.id, ev.student_name)}
                          title="Hapus Penilaian"
                          className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
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
