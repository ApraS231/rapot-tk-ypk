# 📖 Panduan Pengguna (User Manual) - E-Raport TK ABK

Selamat datang di aplikasi **E-Raport Taman Kanak-Kanak untuk Anak Berkebutuhan Khusus**. Aplikasi ini dirancang untuk memudahkan Guru, Pendamping (Shadow Teacher), serta Admin dalam mencatat, memonitor, dan melaporkan perkembangan kualitatif anak-anak secara berkala.

---

## 1. Memulai Aplikasi

1. Pastikan server sudah berjalan di terminal dengan perintah `python frontend/run.py`.
2. Buka browser dan pergi ke tautan `http://127.0.0.1:8000`.
3. Anda akan diarahkan ke halaman **Login**.
4. Gunakan kredensial berikut untuk masuk sebagai administrator utama (bila belum diubah):
   - **Email:** `admin@rapor.tk`
   - **Password:** `admin123`

---

## 2. Mengenal Dashboard

Setelah login, Anda masuk ke halaman **Dashboard**. Di halaman ini Anda dapat melihat:
- **Statistik Cepat:** Menampilkan total jumlah siswa, laporan yang masuk hari ini, dan jumlah raport yang sudah diterbitkan.
- **Aksi Cepat:** Menyediakan jalan pintas untuk menambah siswa baru, menulis laporan harian, mengunggah galeri foto, atau mencetak laporan akhir.
- **Catatan Terkini:** Menginformasikan laporan harian (Daily Reports) terbaru yang masuk pada hari tersebut.

---

## 3. Modul Data Siswa (CRUD)

Anda dapat mengelola seluruh daftar siswa melalui menu **Data Siswa** di sidebar.

- **Melihat Daftar Siswa:** Menampilkan daftar siswa lengkap dengan spesifikasi kebutuhan khusus dan umur mereka.
- **Menambah Siswa:** Klik tombol `+ Tambah Siswa Baru`. Lengkapi formulirnya (Nama, umur, kekhususan, kelas) dan simpan. Data siswa ini menjadi fondasi sebelum membuat laporan apa pun.

---

## 4. Modul Perkembangan Harian

Ini adalah tugas harian *Shadow Teacher* atau Guru Kelas.

- **Menulis Catatan:** Pada menu **Perkembangan Harian**, klik `+ Tulis Catatan Harian`. Anda akan diminta untuk mendeskripsikan aktivitas, perilaku (behavior), serta interaksi sosial sang anak pada tanggal tersebut secara spesifik. Catatan ini nantinya menjadi referensi penting saat merangkum raport penilaian di akhir periode.

---

## 5. Modul Galeri Kegiatan

Modul ini dirancang untuk mendokumentasikan kegiatan belajar mengajar secara visual.

- Navigasi ke menu **Galeri Kegiatan**.
- Klik `+ Upload Foto Kegiatan`. Pilih nama siswa, pilih *file foto* (berformat umum seperti `.jpg` atau `.png`), dan tambahkan deksripsi singkat kegiatan apa yang sedang mereka lakukan.

---

## 6. Modul Raport Kualitatif (Assessments)

Merupakan pencapaian secara berkala, bisa diisi di pertengahan atau akhir pembelajaran (Semester).

- Menuju menu **Raport Kualitatif** lalu **+ Buat Raport Kualitatif**.
- Anda harus memberikan observasi dan penilaian naratif pada 4 kategori utama aspek perkembangan anak ABK:
  - **Motorik:** Sejauh mana kemampuan gerak, sensorik dll.
  - **Bahasa & Komunikasi:** Kemampuan verbal/non-verbal, pelafalan, pemahaman instruksi.
  - **Sosial & Emosional:** Empati, kemampuan berteman, kontrol emosi dsb.
  - **Kognitif:** Pemecahan masalah atau kemampuan analitis.
- Terakhir, Anda bisa menambahkan kesimpulan atau rekomendasi (Summary) ke depannya bagi orang tua atau kepala sekolah.

---

## 7. Cetak Laporan

Modul ini menggabungkan semua data dan menampilkannya sebagai sebuah laporan akhir siap cetak.

1. Buka menu **Cetak Laporan** (diakses pada bagian *Fase Akhir* di Sidebar).
2. Temukan baris dengan nama Siswa terkait. Jika siswa tersebut sudah pernah dibuatkan "Raport Kualitatif", statusnya akan berwarna **Hijau (Siap Cetak)**.
3. Klik tombol **Lihat Laporan**.
4. Halaman khusus pelaporan akan terbuka. Halaman ini sudah diatur sedemikian rupa dengan format margin profesional.
5. Klik tombol **"Cetak PDF"** biru yang ada memegang logo Print (Hanya tampil di layar monitor).
6. Akan terbuka jendela untuk Print browser. Pastikan *Destination* diubah menjadi **Save as PDF** dan ukuran kertasnya diselaraskan ke **A4**, lalu klik OK.

---

## 8. Manajemen Pengguna & Otorisasi Peran

Aplikasi ini menggunakan sistem pembatasan akses berbasis peran (**Role-Based Access Control / RBAC**) untuk keamanan dan pembagian tugas yang jelas:

- **Admin (Guru BK)**:
  - Memiliki akses penuh ke **Manajemen Pengguna** untuk menambah/mengedit akun pendamping (Shadow Teacher).
  - Mengelola data master seluruh siswa (CRUD Siswa) dan mengaitkan siswa dengan pendampingnya.
  - Melakukan **Penilaian Kuantitatif BK** (Kognitif, Motorik, Bahasa, Sosial-Emosional, Kemandirian) serta melihat **Rekap & Komparasi** perkembangan siswa.
  - Memiliki akses *Read-Only* (hanya lihat) pada modul Perkembangan Harian, Galeri Kegiatan, dan Raport Kualitatif (tidak diperkenankan menambah, mengedit, atau menghapus).
- **Guru Shadow (Pendamping)**:
  - Hanya dapat melihat dan mengelola data siswa yang **didampinginya secara spesifik**.
  - Mengelola data harian secara penuh (menulis Perkembangan Harian, mengunggah foto Galeri, dan mengisi Raport Kualitatif) untuk siswa dampingannya.
  - Tidak memiliki akses ke menu Penilaian Kuantitatif BK, Rekap & Komparasi, dan Manajemen Pengguna.

---

## 9. Sistem Notifikasi & Validasi Formulir

Untuk memastikan integritas data dan kenyamanan penggunaan, aplikasi dilengkapi dengan sistem **Toast Notification**:

- **Peringatan Input Tidak Lengkap**:
  Jika Anda mencoba menyimpan data dengan kolom wajib (`*`) yang belum terisi, aplikasi akan membatalkan pengiriman formulir dan langsung menampilkan toast notifikasi merah di pojok kanan atas bertuliskan:  
  `⚠️ Mohon lengkapi seluruh kolom yang wajib diisi!`
- **Umpan Balik Sukses**:
  Setiap kali Anda berhasil melakukan operasi penyimpanan, pembaruan, atau penghapusan data, toast notifikasi hijau akan muncul memberikan umpan balik (misalnya: `✨ Catatan harian berhasil disimpan`). Notifikasi ini otomatis hilang setelah 3.5 detik, dan tautan di bilah alamat browser dibersihkan untuk kenyamanan.

---

## 10. Identitas Visual & Branding

Antarmuka aplikasi telah disesuaikan dengan identitas visual institusi:
- **Halaman Login**: Menggunakan gambar latar belakang resmi `YPK_BG.jpg` dengan logo utama `YPK_LOGO.png`. Deskripsi teks aplikasi dihilangkan agar fokus pada logo utama.
- **Sidebar Menu**: Menampilkan logo utama `YPK_LOGO.png` di pojok kiri atas dan teks deskripsi diubah menjadi **"Monitoring Perkembangan Anak"** di bawah tulisan E-Raport TK.

