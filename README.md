# 🚀 Panduan Memulai Aplikasi (Startup Guide) - E-Raport TK ABK

Selamat datang di repositori **E-Raport TK ABK (Anak Berkebutuhan Khusus)**. Dokumen ini memberikan panduan langkah demi langkah untuk mengonfigurasi, menginstal dependensi, dan menjalankan aplikasi di lingkungan lokal Anda (terutama menggunakan Laragon di Windows).

---

## 📋 Prasyarat Sistem

Sebelum memulai, pastikan perangkat Anda telah memenuhi prasyarat berikut:

1. **Python 3.10 atau versi terbaru**
   - Unduh dari [python.org](https://www.python.org/) atau gunakan Python yang disediakan oleh Laragon.
2. **Node.js (v18 atau versi terbaru) & npm**
   - Unduh dari [nodejs.org](https://nodejs.org/) untuk mengompilasi dan mengelola dependensi frontend React.
3. **Laragon (dengan MySQL)**
   - Laragon digunakan untuk mengelola server basis data MySQL secara lokal.
   - Pastikan layanan MySQL di Laragon sudah berjalan (*Active*).
4. **Web Browser Modern**
   - Google Chrome, Microsoft Edge, Firefox, atau browser berbasis Chromium lainnya.

---

## 🛠️ Langkah-Langkah Pemasangan & Konfigurasi

Ikuti langkah-langkah di bawah ini untuk menjalankan aplikasi pertama kali:

### Langkah 1: Siapkan Environment Variables (`.env`)

Aplikasi memerlukan berkas konfigurasi `.env` untuk menghubungkan aplikasi FastAPI dengan basis data MySQL.
1. Salin berkas [.env.example](file:///c:/laragon/www/Rapor_TK/.env.example) menjadi `.env` di direktori utama:
   ```bash
   cp .env.example .env
   ```
2. Pastikan isi berkas [.env](file:///c:/laragon/www/Rapor_TK/.env) Anda telah dikonfigurasi dengan URL koneksi MySQL yang benar:
   ```env
   DATABASE_URL=mysql+pymysql://root:@localhost:3306/rapor_tk
   ```
   > [!NOTE]
   > Format di atas menggunakan user default Laragon (`root`) dengan kata sandi kosong (`""`), berjalan pada port `3306`, dan database target bernama `rapor_tk`.

---

### Langkah 2: Buat Database di MySQL

Sebelum menjalankan aplikasi, Anda harus membuat database kosong di MySQL:
1. Buka **Laragon** lalu klik tombol **Database** (untuk membuka HeidiSQL atau phpMyAdmin).
2. Hubungkan ke sesi MySQL lokal Anda.
3. Jalankan perintah SQL berikut untuk membuat database:
   ```sql
   CREATE DATABASE rapor_tk CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   ```

---

### Langkah 3: Instal Dependensi Python

Gunakan terminal atau command prompt, masuk ke folder proyek `c:\laragon\www\Rapor_TK`, lalu jalankan instalasi modul-modul yang dibutuhkan dari [requirements.txt](file:///c:/laragon/www/Rapor_TK/requirements.txt):

```bash
pip install -r requirements.txt
```

> [!TIP]
> Disarankan menggunakan Virtual Environment Python (venv) agar pustaka tidak bercampur dengan proyek Python lainnya:
> ```bash
> python -m venv venv
> venv\Scripts\activate
> pip install -r requirements.txt
> ```

---

### Langkah 4: Migrasi Data dari SQLite ke MySQL (Opsional)

Jika Anda memiliki data lama di database SQLite (`rapor_tk.db` di root atau folder backend) dan ingin memindahkannya ke database MySQL yang baru:
1. Pastikan berkas `rapor_tk.db` sudah diletakkan di direktori utama proyek.
2. Jalankan skrip migrasi data menggunakan berkas [migrate_data.py](file:///c:/laragon/www/Rapor_TK/migrate_data.py):
   ```bash
   python migrate_data.py
   ```
3. Skrip akan memvalidasi koneksi dan memindahkan data tabel secara berurutan sesuai relasi *Foreign Key* (User ➔ Student ➔ DailyReport, dll).

---

### Langkah 5: Jalankan Aplikasi

Untuk menjalankan aplikasi di lingkungan lokal Anda:
1. Pastikan Anda berada di root direktori proyek (`Rapor_TK`).
2. Jalankan server:
   ```bash
   python frontend/run.py
   ```
3. Buka web browser Anda dan akses alamat berikut:
   👉 **[http://127.0.0.1:8000](http://127.0.0.1:8000)**

---

## 🔑 Akses Kredensial Default

Setelah server berjalan dan Anda mengakses halaman utama melalui browser, masuklah menggunakan akun Administrator bawaan:

| Role | Email | Password | Kegunaan |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@rapor.tk` | `admin123` | Manajemen pengguna (Guru Shadow), CRUD siswa, Penilaian BK. |

> [!WARNING]
> Sangat disarankan untuk segera mengubah kata sandi default Administrator ini setelah berhasil masuk untuk pertama kalinya demi keamanan data.

---

## 📁 Struktur Folder Proyek

Berikut penjelasan singkat struktur utama proyek ini untuk mempermudah navigasi pengembangan:

```text
Rapor_TK/
├── backend/
│   └── app/
│       ├── auth/             # Logika otentikasi & JWT token
│       ├── database.py       # Konfigurasi koneksi SQLAlchemy
│       ├── main.py           # Inisialisasi FastAPI & middleware SPA
│       ├── models/           # Definisi skema tabel database (SQLAlchemy)
│       ├── routers/          # Endpoint REST API JSON & Router Legasi
│       ├── schemas/          # Validasi data input/output (Pydantic)
│       └── services/         # Logika bisnis tambahan
├── frontend/                 # Direktori Aplikasi Utama (HTML, CSS, static & template Jinja2)
│   ├── static/uploads/       # Tempat penyimpanan gambar & upload foto siswa
│   ├── templates/            # Template HTML halaman web
│   └── run.py                # Script entri utama untuk menjalankan aplikasi
├── .env                      # Pengaturan environment variable (sensitif)
├── migrate_data.py           # Skrip migrasi SQLite -> MySQL
└── requirements.txt          # Daftar library Python yang dibutuhkan
```

---

## ❓ Pemecahan Masalah (Troubleshooting)

### 1. Error: `Can't open file 'app.py': [Errno 2] No such file or directory`
* **Penyebab**: Anda menjalankan perintah `python app.py` di folder `backend`.
* **Solusi**: Jalankan aplikasi dari root folder (`c:\laragon\www\Rapor_TK`) menggunakan perintah:
  ```bash
  python frontend/run.py
  ```

### 2. Error: `ModuleNotFoundError: No module named '...'`
* **Penyebab**: Dependensi belum terpasang atau virtual environment belum aktif.
* **Solusi**: Jalankan kembali `pip install -r requirements.txt`. Jika menggunakan virtual environment, pastikan sudah diaktifkan terlebih dahulu (`venv\Scripts\activate` di Windows).

### 3. Error: `Connection refused` atau database tidak terhubung
* **Penyebab**: Server MySQL di Laragon belum diaktifkan, atau URL di `.env` salah.
* **Solusi**: Buka Laragon, klik tombol **"Start All"**. Periksa kembali konfigurasi database di file `.env`.

---

## 📖 Dokumen Referensi Tambahan

Untuk panduan penggunaan fungsionalitas aplikasi dan detail teknis lainnya, silakan merujuk ke dokumen berikut:
* 📄 **[USER_MANUAL.md](file:///c:/laragon/www/Rapor_TK/USER_MANUAL.md)** — Panduan penggunaan dashboard, modul siswa, pengisian rapor kualitatif, serta cara cetak PDF.
* 📄 **[CODE_EXPLANATION.md](file:///c:/laragon/www/Rapor_TK/CODE_EXPLANATION.md)** — Penjelasan struktur kode, penanganan error, dan integrasi frontend-backend.
* 📄 **[METODE_PENGHITUNGAN.md](file:///c:/laragon/www/Rapor_TK/METODE_PENGHITUNGAN.md)** — Penjelasan metode asesmen kuantitatif BK dan pengolahan statistika grafik perkembangan anak.
