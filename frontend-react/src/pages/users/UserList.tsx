import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { 
  Users, 
  UserPlus, 
  Edit2, 
  KeyRound, 
  Trash2, 
  Loader2, 
  User, 
  ShieldCheck, 
  Lock, 
  Search,
  X,
  Plus
} from 'lucide-react';

interface UserData {
  id: number;
  name: string;
  email: string;
  role: 'admin' | 'pendamping';
}

export const UserList: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { showToast } = useToast();

  const [users, setUsers] = useState<UserData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  // Form State
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [resettingUser, setResettingUser] = useState<UserData | null>(null);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState<'admin' | 'pendamping'>('pendamping');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      } else {
        showToast('Gagal memuat daftar pengguna.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [showToast]);

  const resetForm = () => {
    setName('');
    setEmail('');
    setRole('pendamping');
    setPassword('');
    setEditingUser(null);
    setResettingUser(null);
  };

  const handleEditClick = (u: UserData) => {
    setResettingUser(null);
    setEditingUser(u);
    setName(u.name);
    setEmail(u.email);
    setRole(u.role);
    setPassword('');
  };

  const handleResetPINClick = (u: UserData) => {
    setEditingUser(null);
    setResettingUser(u);
    setPassword('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (resettingUser) {
      // Handle PIN reset
      if (password.length < 4) {
        showToast('PIN/Password minimal 4 karakter.', 'error');
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch(`/api/users/${resettingUser.id}/reset-password`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ password }),
        });
        if (res.ok) {
          showToast(`PIN/Password untuk ${resettingUser.name} berhasil direset!`, 'success');
          resetForm();
        } else {
          const data = await res.json();
          showToast(data.detail || 'Gagal mereset PIN.', 'error');
        }
      } catch (err) {
        showToast('Koneksi internet bermasalah.', 'error');
      } finally {
        setSubmitting(false);
      }
    } else if (editingUser) {
      // Handle edit
      if (!name || !email || !role) {
        showToast('Semua field wajib diisi.', 'error');
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch(`/api/users/${editingUser.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, role }),
        });
        if (res.ok) {
          showToast('Data pengguna berhasil diperbarui!', 'success');
          setUsers(prev => prev.map(u => u.id === editingUser.id ? { ...u, name, email, role } : u));
          resetForm();
        } else {
          const data = await res.json();
          showToast(data.detail || 'Gagal memperbarui pengguna.', 'error');
        }
      } catch (err) {
        showToast('Koneksi internet bermasalah.', 'error');
      } finally {
        setSubmitting(false);
      }
    } else {
      // Handle create
      if (!name || !email || !password || !role) {
        showToast('Semua field wajib diisi.', 'error');
        return;
      }
      setSubmitting(true);
      try {
        const res = await fetch('/api/users', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name, email, password, role }),
        });
        if (res.ok) {
          showToast('Pengguna baru berhasil ditambahkan!', 'success');
          fetchUsers();
          resetForm();
        } else {
          const data = await res.json();
          showToast(data.detail || 'Gagal menambahkan pengguna.', 'error');
        }
      } catch (err) {
        showToast('Koneksi internet bermasalah.', 'error');
      } finally {
        setSubmitting(false);
      }
    }
  };

  const handleDelete = async (id: number, userName: string) => {
    if (currentUser?.id === id) {
      showToast('Anda tidak dapat menghapus akun Anda sendiri.', 'error');
      return;
    }

    if (!window.confirm(`Apakah Anda yakin ingin menghapus akun "${userName}"?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        showToast('Pengguna berhasil dihapus.', 'success');
        setUsers(prev => prev.filter(u => u.id !== id));
      } else {
        const data = await res.json();
        showToast(data.detail || 'Gagal menghapus pengguna.', 'error');
      }
    } catch (e) {
      showToast('Koneksi internet bermasalah.', 'error');
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.email.toLowerCase().includes(search.toLowerCase()) ||
    u.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Header Area */}
      <div>
        <h2 className="text-xl font-bold text-slate-800">Manajemen Pengguna</h2>
        <p className="text-xs text-slate-500 font-medium">Kelola hak akses administrator dan shadow teacher (pendamping)</p>
      </div>

      {/* GOLDEN RATIO GRID */}
      <div className="flex flex-col lg:flex-row gap-6">
        
        {/* Left Column (61.8% width) - Users Table */}
        <div className="w-full lg:w-[61.8%] space-y-4">
          {/* Search Box */}
          <div className="bg-white border border-slate-200/60 rounded-2xl p-4 shadow-sm">
            <div className="relative">
              <Search className="absolute left-4 top-3.5 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari berdasarkan nama, email, atau peran..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-sm"
              />
            </div>
          </div>

          {/* Table Container */}
          {loading ? (
            <div className="flex items-center justify-center min-h-[300px] bg-white border border-slate-200/60 rounded-2xl">
              <div className="flex flex-col items-center gap-3">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                <span className="text-sm text-slate-500 font-medium">Memuat data pengguna...</span>
              </div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="bg-white border border-slate-200/60 rounded-2xl p-12 text-center shadow-sm">
              <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto mb-4">
                <User className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-slate-700 text-sm">Tidak ada data pengguna</h3>
              <p className="text-slate-400 text-xs mt-1">Coba bersihkan kata kunci pencarian Anda.</p>
            </div>
          ) : (
            <div className="bg-white border border-slate-200/60 rounded-2xl shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 text-slate-400 font-bold text-[11px] uppercase tracking-wider border-b border-slate-100">
                      <th className="px-6 py-4 w-12">No</th>
                      <th className="px-6 py-4">Nama Pengguna</th>
                      <th className="px-6 py-4">Alamat Email</th>
                      <th className="px-6 py-4">Peran (Role)</th>
                      <th className="px-6 py-4 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                    {filteredUsers.map((u, idx) => (
                      <tr key={u.id} className="hover:bg-slate-50/50 transition-colors">
                        <td className="px-6 py-4 text-slate-400 font-normal">
                          {idx + 1}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs shrink-0 ${
                              u.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
                            }`}>
                              {u.name[0].toUpperCase()}
                            </div>
                            <div>
                              <div className="font-bold text-slate-900 flex items-center gap-1.5">
                                <span>{u.name}</span>
                                {currentUser?.id === u.id && (
                                  <span className="text-[10px] text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded-full font-bold">Anda</span>
                                )}
                              </div>
                              <div className="text-[10px] text-slate-400 font-normal mt-0.5">ID: #{u.id}</div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 font-normal">
                          {u.email}
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold ${
                            u.role === 'admin' ? 'bg-purple-50 text-purple-700 border border-purple-200/50' : 'bg-blue-50 text-blue-700 border border-blue-200/50'
                          }`}>
                            {u.role === 'admin' ? 'Administrator' : 'Guru Pendamping'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {currentUser?.id !== u.id ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleEditClick(u)}
                                title="Edit Pengguna"
                                className="p-1.5 bg-amber-50 text-amber-600 hover:bg-amber-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleResetPINClick(u)}
                                title="Reset PIN / Password"
                                className="p-1.5 bg-indigo-50 text-indigo-600 hover:bg-indigo-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <KeyRound className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDelete(u.id, u.name)}
                                title="Hapus Pengguna"
                                className="p-1.5 bg-rose-50 text-rose-600 hover:bg-rose-100 rounded-lg transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <span className="text-xs text-slate-300 font-normal pr-4">Aktif</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Right Column (38.2% width) - Contextual Form Panel */}
        <div className="w-full lg:w-[38.2%]">
          <div className="bg-white border border-slate-200/60 rounded-2xl p-6 shadow-sm space-y-4">
            
            {/* Form Title & Icon */}
            <div className="flex items-center justify-between border-b border-slate-50 pb-2">
              <div className="flex items-center gap-2">
                {resettingUser ? (
                  <>
                    <KeyRound className="w-4 h-4 text-indigo-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Reset PIN Akun</h3>
                  </>
                ) : editingUser ? (
                  <>
                    <Edit2 className="w-4 h-4 text-amber-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Edit Profil Pengguna</h3>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-4 h-4 text-primary-500" />
                    <h3 className="font-bold text-slate-800 text-sm">Tambah Pengguna</h3>
                  </>
                )}
              </div>
              
              {(editingUser || resettingUser) && (
                <button 
                  onClick={resetForm}
                  className="p-1 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Context Info */}
            {resettingUser && (
              <div className="p-3 bg-indigo-50 text-indigo-800 text-xs rounded-xl flex gap-2">
                <Lock className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Menyetel ulang PIN / Sandi untuk guru <strong>{resettingUser.name}</strong> ({resettingUser.email}).
                </p>
              </div>
            )}
            {editingUser && (
              <div className="p-3 bg-amber-50 text-amber-800 text-xs rounded-xl flex gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="leading-relaxed">
                  Memperbarui info profil dan hak akses untuk <strong>{editingUser.name}</strong>.
                </p>
              </div>
            )}

            {/* Form Fields */}
            <form onSubmit={handleSubmit} className="space-y-4">
              
              {!resettingUser && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Nama Pengguna <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                      placeholder="Nama lengkap..."
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Alamat Email <span className="text-rose-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="nama@rapor.tk"
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                      Hak Akses (Role) <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={role}
                      onChange={(e) => setRole(e.target.value as 'admin' | 'pendamping')}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
                    >
                      <option value="pendamping">Guru Pendamping (Shadow)</option>
                      {editingUser?.role === 'admin' && (
                        <option value="admin">Administrator (BK)</option>
                      )}
                    </select>
                  </div>
                </>
              )}

              {/* Show Password Field for: Create OR Reset PIN */}
              {(!editingUser || resettingUser) && (
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                    {resettingUser ? 'PIN/Password Baru' : 'PIN/Password Default'} <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder={resettingUser ? "Masukkan PIN baru..." : "PIN bawaan akun baru..."}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent font-medium text-sm transition"
                  />
                  <p className="text-[10px] text-slate-400 font-medium mt-1">Sandi minimum 4 karakter alfanumerik.</p>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="pt-4 border-t border-slate-100 flex gap-2">
                {(editingUser || resettingUser) && (
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 font-bold rounded-xl text-xs transition cursor-pointer"
                  >
                    Batal
                  </button>
                )}
                
                <button
                  type="submit"
                  disabled={submitting}
                  className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-white font-bold rounded-xl text-xs transition shadow-md cursor-pointer ${
                    resettingUser ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-500/10' :
                    editingUser ? 'bg-amber-500 hover:bg-amber-600 shadow-amber-500/10' :
                    'bg-primary-600 hover:bg-primary-700 shadow-primary-500/10'
                  }`}
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Memproses...</span>
                    </>
                  ) : resettingUser ? (
                    <>
                      <KeyRound className="w-3.5 h-3.5" />
                      <span>Reset Sandi</span>
                    </>
                  ) : editingUser ? (
                    <>
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Simpan Perubahan</span>
                    </>
                  ) : (
                    <>
                      <Plus className="w-3.5 h-3.5" />
                      <span>Tambah Pengguna</span>
                    </>
                  )}
                </button>
              </div>

            </form>
          </div>
        </div>

      </div>
    </div>
  );
};
