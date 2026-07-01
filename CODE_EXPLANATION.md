# 💻 Penjelasan Coding & Arsitektur - E-Raport TK ABK

Dokumen ini menjelaskan rancangan rekayasa piranti lunak (*Software Engineering*), susunan folder, hingga *framework* (kerangka kerja) apa saja yang digunakan selama membuat E-Raport TK untuk Anak Berkebutuhan Khusus ini.

---

## 1. Stack Teknologi yang Digunakan

- **Bahasa Utama:** Python 3.x
- **Backend Framework:** FastAPI (Mampu menangani operasi *asynchronous* dan sangat cepat dalam melakukan *web routing*).
- **ORM & Database:** SQLAlchemy & SQLite (Memudahkan komunikasi ke basis data dengan bahasa Python (ORM), tanpa melibatkan banyak penulisan kueri mentah. SQLite sangat portabel karena tak memerlukan instalasi peladen/server).
- **Frontend Engine:** Jinja2 (Mesin _template_ dari Python untuk membuat aplikasi *Server-Side Rendered*)
- **CSS Framework:** Tailwind CSS (Melalui metode integrasi *Play CDN*, kita bisa menuliskan _styling_ antarmuka secara instan pada kode HTML lewat kumpulan _utility classes_).
- **Frontend Interactivity:** HTMX (Membangun halaman *Single Page Application*-like (tanpa reload), walau tanpa kerangka JavaScript berat seperti React).

---

## 2. Struktur Direktori

Dianut prinsip **MVC-pattern** (*Models-Views-Controllers*) namun termutakhir.
```text
e:\Project Pribadi\RaporTK\
│
├── backend/
│   └── app/
│       ├── _auth/          # Konfigurasi JSON Web Token, Bcrypt & keamanan
│       ├── _models/        # Definisi tabel Database (User, Student, dll) via SQLAlchemy
│       ├── _routers/       # (Controllers) Mengatur endpoint routing seperti GET HTTP dan POST
│       │   ├── auth.py
│       │   ├── reports.py  # Menyambung ke sistem Cetak PDF Laporan
│       │   └── ...
│       ├── database.py     # Setup Engine dan koneksi SQLite
│       └── main.py         # Entry point aplikasi FastAPI
│
├── frontend/
│   ├── _static/            # Untuk tempat foto uploads, custom css (jika ada) dan file flat lain
│   ├── _templates/         # Berisi file-file HTML (View) Jinja2 untuk dirender oleh Routers
│   │   ├── assessments/
│   │   ├── base.html       # Kerangka dasar HTML berisi Navigasi (Sidebar) + dependencies script
│   │   ├── dashboard.html
│   │   ├── reports/        # View khusus print-out PDF (@media print CSS)
│   │   └── ...
│   └── run.py              # Script runner lokal dengan Uvicorn untuk menjalankan Backend Utama
│
└── requirements.txt        # Kumpulan dependencies (Library pip)
```

---

## 3. Konsep *Routing* (Backend `routers/*.py`)
Aplikasi ini dipecah-pecahkan dalam bentuk "*Routers*". FastApi memungkinkan perutean (`app.include_router`) guna meminimalisir penumpukan *code logic* di `main.py`.

Contoh kode di dalam `backend/app/routers/students.py`:
```python
@router.post("/students/add")
async def student_add(... parameter ... , db: Session = Depends(get_db)):
    # 1. Menerima POST request (Form Submit)
    # 2. Mengecek status authentikasi JWT token via Cookies
    # 3. Menulis baris (Row Record) ke Database SQLite
    ...
```
Itu berarti, file HTML akan mengirim form ke `/students/add`, sistem memproses dan me-redirect pengguna kembali.

---

## 4. Keamanan : Autentikasi Menggunakan JWT (JSON Web Tokens)
Berbeda dengan sistem *session/cookies* di Django/PHP, aplikasi ini diatur layaknya *Decoupled System*.
- Saat Anda sukses Login, Backend pada bagian `auth.py` merumuskan _Token JWT_ yang aman lalu menyimpannya (inject) ke *Cookies Browser* milik Pengguna (`httponly=True` agar aman dari XSS).
- Setiap pengaksesan _route_ tertentu, sistem membaca *Cookie* tersebut lewat `decode_access_token()`. Kalau datanya belum kedaluwarsa dan valid, maka izin pun dirilis. Jika tidak, ditalang ke `/login`. Algoritma pembatasan juga dilakukan pada sistem hash *Password* menggunakan **Bcrypt**.

---

## 5. Implementasi Frontend (HTML Jinja2 + UI Layouting)

Tidak ada pemisahan Frontend seperti `React / Vue`. Ini adalah bentuk murni SSR (Server-Side Render).
FastAPI membaca HTML yang didesain menggunakan **Tailwind CSS**. Di dalam file `frontend/templates/base.html`, ada script:
```html
<script src="https://cdn.tailwindcss.com"></script>
```
Script ini akan langsung menerjemahkan _class_ khusus seperti `bg-primary-600` menjadi sintaksis warna yang pas. Semua modifikasi navigasi ditangani melalui logika kondisi *IF-ELSE* langsung di dalam sintaks `{% if user %}` dari Jinja2.

---

## 6. Bagaimana Export PDF Bekerja (Trik `@media print`)

Implementasi Laporan Fase Akhir dirancang dengan pola yang efisien untuk mengatasi masalah umum OS Windows yang kerap *error* saat dipasangi engine khusus Backend PDF (*wkhtmltopdf* / *weasyprint*).

1. Sistem menghasilkan file peramban HTML di `/reports/{student_id}` tanpa Sidebar atau Navbar (khusus terisolasi di rute itu).
2. File tersebut diinjeksi CSS media bawaan *(Media Queries untuk printer)*:
   ```css
   @media print {
        body { background-color: white; }
        .no-print { display: none !important; }
        @page { margin: 1.5cm; } /* Diatur menyesuaikan ukuran A4 pada Windows default */
   }
   ```
3. Begitu Anda mengeklik **Cetak PDF**, kode javascript `window.print()` dipicu, sehingga otomatis mengalihfungsikan mode *Save to Document* layaknya Export PDF sesungguhnya, namun lebih ringan tanpa *overhead server* !
