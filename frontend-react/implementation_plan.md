# Rencana Implementasi: Fitur Unggah & Hapus Foto Galeri Kegiatan untuk Admin dan Pendamping

Dokumen ini menjelaskan rencana perubahan untuk mengaktifkan fitur penambahan dan penghapusan foto kegiatan siswa di halaman Galeri Kegiatan bagi pengguna bersatus **Admin** (sebelumnya hanya bisa diakses oleh **Pendamping**).

---

## User Review Required

> [!IMPORTANT]
> **Perubahan Autorisasi Backend:**
> REST API untuk unggah (`POST /gallery/api/upload`) dan hapus (`DELETE /gallery/api/delete/{id}`) sebelumnya memblokir peran `admin` dengan respon `403 Forbidden: Shadow Teacher only`.
> Kami akan memperbarui otorisasi di backend agar:
> 1. Peran `admin` diizinkan mengunggah foto untuk **seluruh siswa** di sistem.
> 2. Peran `admin` diizinkan menghapus foto kegiatan mana pun.
> 3. Peran `pendamping` tetap dibatasi hanya untuk siswa yang didelegasikan kepadanya (`teacher_id == user.id`).

---

## Proposed Changes

### 1. Komponen Backend (API Otorisasi)

#### [MODIFY] [gallery.py](file:///c:/laragon/www/Rapor_TK/backend/app/routers/gallery.py)
* Memperbarui endpoint `api_gallery_upload` (baris 161-198) untuk mengizinkan peran `admin` dan melewati pemeriksaan kepemilikan guru jika pengguna adalah admin.
* Memperbarui endpoint `api_gallery_delete` (baris 201-228) untuk mengizinkan peran `admin` menghapus berkas foto mana pun.

---

### 2. Komponen Frontend React (UI/UX)

#### [MODIFY] [GalleryList.tsx](file:///c:/laragon/www/Rapor_TK/frontend-react/src/pages/gallery/GalleryList.tsx)
* Menghapus pembatasan `isShadowTeacher` pada penampilan panel Unggah Foto Baru (`Upload Form Column`) sehingga **Admin** juga dapat melihat formulir unggahan di sisi kanan.
* Menghapus pembatasan `isShadowTeacher` pada tombol Hapus Foto (`Trash2`) di setiap kartu foto kegiatan sehingga **Admin** dapat menghapus dokumentasi.
* Mempertahankan tata letak Golden Ratio ($\Phi \approx 1.618$) di desktop secara konsisten bagi seluruh peran yang masuk:
  * Grid Foto Kegiatan mengambil lebar **$61.8\%$** (`lg:w-[61.8%]`).
  * Panel Unggah Foto Baru mengambil lebar **$38.2\%$** (`lg:w-[38.2%]`).

---

## Verification Plan

### Automated & Manual Verification
1. **Pengujian dengan Akun Admin (`admin@rapor.tk`)**:
   * Membuka halaman Galeri Kegiatan.
   * Memastikan form "Unggah Foto Baru" muncul di bagian kanan layar (tata letak Golden Ratio).
   * Mencoba mengunggah foto baru untuk siswa tertentu (misalnya siswa "apin").
   * Memastikan foto berhasil diunggah dan muncul di grid sebelah kiri.
   * Mencoba menghapus foto kegiatan tersebut dan memastikan foto terhapus dengan sukses.
2. **Pengujian dengan Akun Pendamping (jika ada)**:
   * Membuka halaman Galeri Kegiatan dan memastikan fungsionalitas unggah/hapus tetap berjalan normal serta terbatas pada siswa bimbingannya saja.
