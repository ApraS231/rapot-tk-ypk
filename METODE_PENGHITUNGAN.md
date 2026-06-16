# 📊 Metode Penghitungan & Logika Evaluasi - E-Raport TK ABK

Dokumen ini menjelaskan secara rinci rumus matematika, pembobotan nilai, logika predikat, dan algoritma yang digunakan dalam pengolahan data perkembangan siswa pada aplikasi E-Raport ini.

---

## 1. Metode Penilaian Kuantitatif BK (Bimbingan Konseling)

Pada modul penilaian BK, perkembangan anak diukur melalui 5 aspek utama perkembangan dengan menggunakan **skala penilaian terbobot**.

### A. Skala Nilai Indikator (Likert)
Setiap indikator di dalam aspek perkembangan dinilai oleh guru menggunakan skala berikut:
* **1** = **BB** (Belum Berkembang)
* **2** = **MB** (Mulai Berkembang)
* **3** = **BSH** (Berkembang Sesuai Harapan)
* **4** = **BSB** (Berkembang Sangat Baik)

### B. Rumus Rata-Rata Aspek (Domain Average)
Untuk setiap aspek perkembangan (Kognitif, Motorik, Bahasa, Sosial-Emosional, Kemandirian), nilai rata-rata aspek diperoleh dari rata-rata seluruh skor indikator di dalam aspek tersebut.

$$\text{Rata-rata Aspek } (R) = \frac{\sum_{i=1}^{n} \text{Skor Indikator}_i}{n}$$

Di mana:
* $n$ = Jumlah total indikator dalam aspek perkembangan tersebut.

*Contoh Python Code:*
```python
avg_cognitive = sum(domain_scores["cognitive"]) / len(domain_scores["cognitive"])
```

### C. Rumus Indeks Komposit Terbobot (Weighted Composite Index)
Indeks Komposit menggabungkan kelima rata-rata aspek perkembangan di atas berdasarkan pembobotan persentase yang disesuaikan dengan kurikulum anak berkebutuhan khusus:
1. **Kognitif**: Bobot **25%** ($0.25$)
2. **Motorik**: Bobot **25%** ($0.25$)
3. **Bahasa & Komunikasi**: Bobot **20%** ($0.20$)
4. **Sosial-Emosional**: Bobot **15%** ($0.15$)
5. **Kemandirian**: Bobot **15%** ($0.15$)

$$\text{Indeks Komposit} = (R_{\text{kognitif}} \times 0.25) + (R_{\text{motorik}} \times 0.25) + (R_{\text{bahasa}} \times 0.20) + (R_{\text{sosial}} \times 0.15) + (R_{\text{kemandirian}} \times 0.15)$$

*Catatan:* Hasil penghitungan ini dibulatkan hingga dua angka di belakang koma (`round(val, 2)`).

### D. Rumus Indeks Persentase Perkembangan (Development Percentage)
Untuk mempermudah visualisasi grafik perkembangan (misalnya pada grafik Chart.js), Indeks Komposit yang berskala **1.0 s.d. 4.0** dikonversi menjadi persentase dari **0% s.d. 100%**:

$$\text{Persentase Indeks} = \frac{\text{Indeks Komposit} - 1.0}{3.0} \times 100\%$$

*Penjelasan:*
* Jika siswa memperoleh skor minimum (semua indikator bernilai `1` / BB), maka Indeks Komposit = `1.0`. Persentase = $\frac{1.0 - 1.0}{3.0} \times 100\% = 0\%$.
* Jika siswa memperoleh skor maksimum (semua indikator bernilai `4` / BSB), maka Indeks Komposit = `4.0`. Persentase = $\frac{4.0 - 1.0}{3.0} \times 100\% = 100\%$.

### E. Penentuan Predikat Akhir
Predikat akhir yang dicetak pada laporan perkembangan ditentukan dari rentang nilai Indeks Komposit siswa:
* **BSB** (Berkembang Sangat Baik) : $\text{Indeks} \ge 3.50$
* **BSH** (Berkembang Sesuai Harapan) : $2.50 \le \text{Indeks} < 3.50$
* **MB** (Mulai Berkembang) : $1.50 \le \text{Indeks} < 2.50$
* **BB** (Belum Berkembang) : $\text{Indeks} < 1.50$

---

## 2. Logika Tren Perbandingan Perkembangan (Comparison Trend)

Sistem membandingkan evaluasi berkala siswa untuk mendeteksi arah perkembangan belajar anak (naik, turun, atau stabil).

### Rumus Perbandingan Aspek:
Untuk penilaian terbaru ($T_1$) dan penilaian sebelumnya ($T_0$), selisih nilai aspek dihitung:

$$\text{Selisih} = \text{Skor } T_1 - \text{Skor } T_0$$

### Kategori Status Tren:
* **Naik**: Jika $\text{Selisih} > 0$ (Menunjukkan peningkatan kemampuan belajar anak).
* **Turun**: Jika $\text{Selisih} < 0$ (Menunjukkan perlunya perhatian atau intervensi khusus).
* **Stabil**: Jika $\text{Selisih} = 0$ (Menunjukkan kemampuan anak konsisten dengan periode sebelumnya).

---

## 3. Logika Penghitungan Usia Siswa secara Akurat

Untuk mencegah kesalahan penginputan usia akibat pembulatan tahun lahir saja, sistem menghitung usia siswa secara akurat berdasarkan selisih tanggal kelahiran (`birth_date`) dengan tanggal hari ini.

### Rumus Logika (Python):
```python
calculated_age = today.year - birth.year - ((today.month, today.day) < (birth.month, birth.day))
```

### Cara Kerja Logika:
1. Kurangkan tahun hari ini dengan tahun lahir (`today.year - birth.year`).
2. Periksa apakah bulan dan hari kelahiran di tahun ini belum terlewati:
   - Jika bulan dan hari saat ini lebih kecil dari bulan dan hari kelahiran (`(today.month, today.day) < (birth.month, birth.day)`), kondisi bernilai `True` (dikonversi ke angka `1`).
   - Jika sudah terlewati atau hari ini adalah hari ulang tahunnya, kondisi bernilai `False` (dikonversi ke angka `0`).
3. Kurangkan selisih tahun dengan hasil kondisi tersebut. Langkah ini memastikan usia bertambah tepat pada hari ulang tahun anak, bukan sekadar pergantian tahun kalender.
