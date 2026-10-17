# V1 Academic & Professional Portfolio — GitHub Pages

Website statis dengan dua ruang independen:
- `index.html` — Professional Portfolio (homepage, Experience, Projects & Modeling, Publications, Digital Tools (ASPDF), Contact)
- `academic.html` — Academic Portal (Courses + Materials, Academic Services, public grade announcements)
- `admin.html` — **editor lokal** di browser, untuk mengedit data dan mengimpor nilai Excel (tidak punya akses otomatis ke GitHub)
- `site.json` — semua data website publik, termasuk foto yang diperkecil, dan ranking yang sudah disamarkan.

## Daftar akun dan publish pertama

1. Buka https://github.com/signup, daftar dengan email dan password, pilih username, dan verifikasi email.
2. Buka https://github.com/new, buat repository **PUBLIC** dengan nama persis `<username>.github.io` (ganti username dengan akun sendiri). Sebaiknya centang **Add a README file**.
3. Ekstrak file `V1_Portfolio_GitHubPages.zip` di komputer.
4. Buka repository > **Add file** > **Upload files**. Pilih **SEMBILAN file website** dari folder hasil ekstraksi (`index.html`, `academic.html`, `admin.html`, `styles.css`, `common.js`, `portfolio.js`, `academic.js`, `admin.js`, `site.json`). Tidak perlu mengunggah ZIP. `README.md` opsional. Klik **Commit changes**.
5. Masuk **Settings** > **Pages** > **Build and deployment** > **Source: Deploy from a branch** > **Branch: main** > **/(root)** > **Save**.
6. Buka `https://<username>.github.io` (pertama kali bisa perlu beberapa menit).
7. Academic Portal: `https://<username>.github.io/academic.html`
8. Editor: `https://<username>.github.io/admin.html`

## Mengubah profil, pengalaman, proyek, publikasi, dan materi

1. Buka `admin.html` pada alamat GitHub Pages Anda.
2. Pilih kategori di sidebar, isi form, dan Save. Pengeditan tersimpan di **localStorage browser saja** — bukan di GitHub.
3. Klik **Preview Portfolio** atau **Preview Academic**; link pratinjau menambahkan `?preview=1`, yang hanya membaca draft dari browser yang sama.
4. Klik **Export & Publish** > **Copy JSON**, lalu buka file `site.json` di repository GitHub.
5. Klik ikon pensil **Edit this file**, hapus isi yang lama, paste JSON, dan **Commit changes**.
6. Publikasi akan mengikuti pembaruan GitHub Pages. Hasil download `site.json` dapat digunakan sebagai cadangan.

PENTING: Akun GitHub **tidak** perlu ditulis ke admin. Tidak ada token GitHub di website. `admin.html` sengaja tidak punya autentikasi dan tidak bisa memodifikasi file publik secara langsung. Siapa pun bisa mengakses halaman Admin tetapi edit mereka hanya tersimpan dalam browser masing-masing. Jangan simpan data rahasia pada repository Pages publik.

## Foto

Editor dapat menerima foto lokal (.jpg, .png, dll.) dan otomatis mengubahnya menjadi WebP kecil. Foto dimasukkan ke dalam site.json agar mudah dipublikasikan tanpa upload file terpisah. Untuk galeri yang sangat banyak, sebaiknya di versi berikutnya dipindahkan ke media hosting/GitHub asset files, karena JSON akan membesar dan localStorage browser punya batas kapasitas.

## Nilai

- Import `*.xlsx`, `*.xls`, atau `*.csv` lewat Editor > Grade Announcements.
- Spreadsheet membutuhkan kolom **NPM** (atau NIM), **Nama**, **Nilai Akhir** (atau Score). Kolom **Grade** opsional.
- Nilai 0-100 diurutkan menurun; nilai sama memiliki rank yang sama. Konversi otomatis bila Grade kosong: `>=85 A, >=80 A-, >=75 B+, >=70 B, >=65 B-, >=60 C+, >=55 C, >=50 D, selain itu E`.
- Hanya nama pertama dan NPM dua karakter pertama + `••••` + tiga karakter terakhir yang disimpan dalam JSON hasil ekspor. File XLSX asli tidak diunggah ke GitHub.
- **Tetap dapat teridentifikasi** ketika kelas kecil atau nama depan unik. Pertimbangkan persetujuan/pedoman institusi sebelum menerbitkan, meskipun pengumuman nilai memang ditujukan publik.
- Import Excel memakai SheetJS dari CDN. Jika CDN diblokir, gunakan CSV.

## Batasan V1 / lanjut pengembangan

- **Belum one-click publish** dari Editor ke GitHub. Editor membutuhkan manual update `site.json` lewat GitHub.
- **Belum backend admin privat**: versi selanjutnya dapat memakai Apps Script + Sheets + Drive + proses publish terotorisasi.
- Modul Apps Script Courses/Capstone/Skripsi/Magang/Asdos tetap aplikasi terpisah dan menggunakan login masing-masing. Tautan diset lewat Editor > Academic Services.
- Google Drive PDF dapat ditampilkan lewat iframe, sepanjang izin berbagi memungkinkan. Bila viewer tidak dapat dibuka (kebijakan browser/izin), tombol Buka di tab baru tersedia.
- Tidak menyimpan nilai lengkap, nama lengkap, atau NPM lengkap pada versi data ekspor dari grade importer.

## Struktur 9 file utama

```
index.html
academic.html
admin.html
styles.css
common.js
portfolio.js
academic.js
admin.js
site.json
```

Tidak perlu memasang Node.js, WordPress, maupun server database untuk V1.
