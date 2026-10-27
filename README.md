# 📚 WikiFlow — Internal Knowledge Base

**WikiFlow** adalah aplikasi *Internal Knowledge Base* yang dirancang untuk membantu tim Scrum menyimpan, mengelola, mencari, dan membagikan dokumentasi proyek dalam satu platform terpusat.

---

## 👥 Tim Pengembang

| Nama Anggota                 | Divisi             |
| ---------------------------- | ------------------ |
| **Rahma Santika Al Anshori** | Backend Developer  |
| **Jibril Ibni Jubair**       | Frontend Developer |
| **Jihan Fauziah**            | UI/UX Designer     |

---

## 📌 Informasi Proyek

| Informasi       | Keterangan                   |
| --------------- | ---------------------------- |
| Nama Proyek     | WikiFlow                     |
| Jenis Proyek    | Web Application              |
| Kategori        | Internal Knowledge Base      |
| Kegiatan        | Praktik Kerja Lapangan (PKL) |
| Backend         | Laravel 12                   |
| Frontend        | Next.js, React, TypeScript   |
| Database        | MySQL                        |
| API             | REST API                     |
| Version Control | Git dan GitHub               |

---

## 🎯 Latar Belakang

Dalam pengembangan perangkat lunak menggunakan metode Scrum, dokumentasi proyek memiliki peran penting agar seluruh anggota tim dapat mengakses informasi yang sama.

Dokumentasi yang tersebar di berbagai tempat dapat menyulitkan anggota tim ketika mencari informasi teknis, panduan, atau catatan proyek.

Oleh karena itu, WikiFlow dikembangkan sebagai platform dokumentasi internal yang memungkinkan anggota tim mengelola artikel, mengelompokkan informasi berdasarkan kategori, menambahkan tag, serta melakukan pencarian dokumentasi dengan lebih mudah.

## ✨ Fitur Utama

### 1. Autentikasi dan Pengguna

* Login menggunakan email dan password.
* Registrasi pengguna.
* Autentikasi menggunakan Laravel Sanctum.
* Autentikasi API menggunakan token.
* Pembagian hak akses berdasarkan role Admin dan User.
* Logout pengguna.

### 2. Manajemen Artikel

* Menampilkan daftar artikel dokumentasi.
* Melihat detail artikel.
* Membuat artikel baru.
* Mengedit artikel.
* Menghapus artikel.
* Mengelola kategori artikel.
* Menambahkan tag pada artikel.
* Mencari artikel berdasarkan kata kunci.
* Memfilter artikel berdasarkan kategori atau tag.

### 3. Manajemen Kategori dan Tag

* Membuat kategori dokumentasi.
* Mengubah kategori.
* Menghapus kategori.
* Menambahkan tag.
* Mengelola tag untuk membantu pengelompokan dokumentasi.

### 4. Hak Akses Pengguna

* **Admin:** mengelola data dan fitur sesuai hak akses yang ditentukan.
* **User:** mengakses dokumentasi dan menjalankan tindakan yang diizinkan sesuai hak aksesnya.

*Catatan: ketersediaan fitur mengikuti implementasi akhir aplikasi.*

---

## 🛠️ Teknologi yang Digunakan

### Backend

* PHP 8.2
* Laravel 12
* Laravel Sanctum
* REST API

### Frontend

* Next.js 16
* React 19
* TypeScript
* CSS

### Database

* MySQL

### Tools Pengembangan

* Visual Studio Code
* Git
* GitHub
* Composer
* Node.js
* npm
* Postman atau alat sejenis untuk pengujian API

---

## 🏗️ Arsitektur Aplikasi

WikiFlow menggunakan arsitektur frontend dan backend yang terpisah.

```text
WikiFlow
│
├── Frontend
│   ├── Next.js
│   ├── React
│   └── TypeScript
│
├── Backend
│   ├── PHP
│   ├── Laravel 12
│   ├── Laravel Sanctum
│   └── REST API
│
└── Database
    └── MySQL
```

Frontend mengirimkan permintaan ke backend melalui REST API. Backend memproses permintaan, menjalankan autentikasi dan otorisasi, berinteraksi dengan database MySQL, kemudian mengembalikan respons kepada frontend.

---

## 📂 Struktur Folder

```text
WikiFlow-app/
│
├── backend/
│   ├── app/
│   ├── bootstrap/
│   ├── config/
│   ├── database/
│   │   ├── migrations/
│   │   ├── factories/
│   │   └── seeders/
│   ├── routes/
│   │   ├── api.php
│   │   └── web.php
│   ├── tests/
│   ├── .env.example
│   ├── artisan
│   └── composer.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.tsx
│   │   └── api.ts
│   ├── .env.local
│   └── package.json
│
└── README.md
```

*Struktur folder dapat berbeda sesuai perkembangan implementasi proyek.*

---

## ⚙️ Persyaratan Sistem

Pastikan perangkat sudah memiliki:

* PHP 8.2 atau versi yang sesuai dengan dependensi backend.
* Composer.
* MySQL Server.
* Node.js dan npm.
* Git.

---

## 🚀 Cara Menjalankan Proyek

### 1. Clone Repository

```bash
git clone <URL_REPOSITORY>
cd WikiFlow-app
```

Ganti `<URL_REPOSITORY>` dengan URL repository GitHub WikiFlow.

### 2. Menjalankan Backend

Masuk ke folder backend:

```bash
cd backend
```

Instal dependensi:

```bash
composer install
```

Salin file konfigurasi:

```bash
copy .env.example .env
```

Buat application key:

```bash
php artisan key:generate
```

### 3. Konfigurasi Database

Buat database MySQL:

```sql
CREATE DATABASE wikiflow_db;
```

Sesuaikan konfigurasi pada file `backend/.env`:

```env
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=wikiflow_db
DB_USERNAME=root
DB_PASSWORD=
```

Sesuaikan username dan password dengan konfigurasi MySQL di perangkat masing-masing.

Jalankan migrasi:

```bash
php artisan migrate
```

Jika proyek memiliki seeder yang diperlukan dan sudah diperiksa, jalankan:

```bash
php artisan db:seed
```

### 4. Jalankan Server Backend

```bash
php artisan serve
```

Secara default, server Laravel berjalan pada:

```text
http://127.0.0.1:8000
```

### 5. Menjalankan Frontend

Buka terminal baru dan masuk ke folder frontend:

```bash
cd frontend
```

Instal dependensi:

```bash
npm install
```

Buat atau sesuaikan file `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://127.0.0.1:8000/api
```

Jalankan frontend:

```bash
npm run dev
```

Buka aplikasi melalui browser:

```text
http://localhost:3000
```

**Penting:** jalankan backend dan frontend secara bersamaan agar aplikasi dapat berkomunikasi dengan API lokal.

---

## 🔌 Endpoint API

Berikut daftar endpoint utama yang digunakan atau ditargetkan dalam aplikasi WikiFlow.

| Method    | Endpoint               | Kegunaan                                  |
| --------- | ---------------------- | ----------------------------------------- |
| POST      | `/api/auth/register`   | Registrasi pengguna                       |
| POST      | `/api/auth/login`      | Login pengguna                            |
| GET       | `/api/auth/user`       | Mendapatkan informasi pengguna yang login |
| POST      | `/api/auth/logout`     | Logout pengguna                           |
| GET       | `/api/articles`        | Mendapatkan daftar artikel                |
| POST      | `/api/articles`        | Membuat artikel                           |
| GET       | `/api/articles/{slug}` | Mendapatkan detail artikel                |
| PUT/PATCH | `/api/articles/{id}`   | Memperbarui artikel                       |
| DELETE    | `/api/articles/{id}`   | Menghapus artikel                         |
| GET       | `/api/categories`      | Mendapatkan daftar kategori               |
| POST      | `/api/categories`      | Membuat kategori                          |
| PUT/PATCH | `/api/categories/{id}` | Memperbarui kategori                      |
| DELETE    | `/api/categories/{id}` | Menghapus kategori                        |
| GET       | `/api/tags`            | Mendapatkan daftar tag                    |
| POST      | `/api/tags`            | Membuat tag                               |
| PUT/PATCH | `/api/tags/{id}`       | Memperbarui tag                           |
| DELETE    | `/api/tags/{id}`       | Menghapus tag                             |

*Catatan: pastikan setiap endpoint tersedia dan berfungsi sebelum menyatakan seluruh API selesai.*

---

## 🔐 Keamanan Aplikasi

Aspek keamanan yang diperhatikan dalam pengembangan WikiFlow meliputi:

* Autentikasi menggunakan Laravel Sanctum.
* Validasi input pada backend.
* Pembatasan akses berdasarkan role pengguna.
* Middleware untuk endpoint yang memerlukan autentikasi.
* Penyimpanan konfigurasi sensitif melalui file environment.
* Penggunaan `.env.example` sebagai contoh konfigurasi.

**Jangan mengunggah file `.env` yang berisi kredensial database atau informasi rahasia ke repository publik.**

---

## 🧪 Pengujian

Pengujian aplikasi mencakup:

* Login dan logout.
* Registrasi pengguna.
* Validasi input.
* Hak akses Admin dan User.
* CRUD artikel.
* Pengelolaan kategori dan tag.
* Pencarian dan penyaringan artikel.
* Integrasi frontend dengan backend.
* Koneksi dan penyimpanan data MySQL.
* Penanganan kesalahan API.

Status pengujian perlu disesuaikan dengan hasil pengujian aktual.

---

## 🎓 Tujuan Pengembangan

WikiFlow dikembangkan sebagai bagian dari kegiatan Praktik Kerja Lapangan (PKL) untuk menerapkan keterampilan dalam pengembangan aplikasi web, pengelolaan database, pembuatan REST API, desain antarmuka, serta integrasi frontend dan backend.

Melalui proyek ini, setiap anggota tim berkontribusi sesuai divisi masing-masing untuk membangun aplikasi dokumentasi internal yang terstruktur dan mudah digunakan.

---

## 📌 Status Proyek

Pengembangan WikiFlow berfokus pada:

* Backend dan REST API.
* Database MySQL.
* Autentikasi dan otorisasi pengguna.
* Integrasi frontend dan backend.
* Manajemen artikel, kategori, dan tag.
* Pengujian fitur aplikasi.

Status penyelesaian setiap fitur mengikuti implementasi dan pengujian terbaru.

---

## 📄 Lisensi

Lisensi proyek dapat ditentukan oleh tim sesuai kebutuhan penggunaan dan distribusi aplikasi.

---

**WikiFlow — One Place for Every Team Knowledge.**
