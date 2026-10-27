# Panduan Penggunaan

## 1. Unduh file website

1. Login ke [GitHub](https://github.com/).
2. Buka repository yang berisi template website ini.
3. Klik **Code → Download ZIP** untuk mengambil file, atau **Fork** jika ingin mengembangkan kode melalui GitHub.
4. Jika mengunduh ZIP, ekstrak ke folder komputer. Buka folder hasil ekstraksi yang berisi `index.html`.
5. **Jangan langsung mengunggah seluruh isi salinan repository.** Periksa dan keluarkan file data yang bukan milik Anda, khususnya `assets/grades/`, Excel nilai, berkas duplikat/backup, serta dokumen atau gambar pribadi yang mungkin masih ada pada versi lama.

**Penting:** ini adalah **kode tampilan (frontend)**, bukan paket website mandiri lengkap. Data yang tampil pada versi aktif dibaca melalui Google Apps Script, Google Sheets, dan Google Drive. Kode backend, database, dan akses admin pribadi **tidak disertakan** dalam repository. Agar website menampilkan data Anda sendiri, siapkan backend sendiri yang kompatibel sebelum mempublikasikan halaman.

## 2. Buat repository GitHub Pages sendiri

1. Dari akun GitHub Anda, klik **New repository**.
2. Untuk alamat website utama gratis, beri nama repository **persis** `<username>.github.io` dengan mengganti `<username>` sesuai username akun Anda.
3. Pilih **Public**, kemudian klik **Create repository**.
4. Pada repository baru, pilih **Add file → Upload files**.
5. Unggah file website ke **root** repository (jangan masukkan ke folder tambahan). File utama yang dipakai adalah:

   ```text
   index.html
   academic.html
   common.js
   portfolio.js
   academic.js
   v46-download.js
   styles.css
   v7.css, v9.css, v10.css, ... v19.css (yang tersedia)
   assets/icons/           (jika ikon tersebut memang ingin digunakan)
   asj-round.png / asj-square.png / favicon.* (ganti dengan logo Anda)
   ```

6. Klik **Commit changes**.
7. Buka **Settings → Pages → Build and deployment**.
8. Pada **Source**, pilih **Deploy from a branch**; pilih branch **main**, folder **/(root)**, kemudian **Save**.
9. Buka `https://<username>.github.io/` untuk halaman utama dan `https://<username>.github.io/academic.html` untuk halaman Academic Portal.

Jika belum ada backend milik sendiri, halaman mungkin terbuka tetapi isi dinamisnya **belum tampil**, atau masih meminta data dari backend asal yang tertulis dalam `common.js`. Selesaikan langkah berikut sebelum website digunakan atau dibagikan.

## 3. Siapkan penyimpanan data sendiri

1. Buat **Google Spreadsheet baru** yang hanya bisa diakses akun Anda. Gunakan sebagai tempat menyimpan profil, pendidikan, pengalaman, proyek, publikasi, kegiatan, daftar materi, tools, dan pengumuman nilai.
2. Siapkan penyimpanan **Google Drive** untuk gambar profil, foto proyek, dokumentasi, slideshow, dan file unduhan.
3. Pisahkan data menjadi dua kelompok:
   - **Draft/privat:** data yang sedang diedit, identitas lengkap, buku tamu, serta URL unduhan asli.
   - **Published:** konten yang secara sengaja telah dipublikasikan dan aman ditampilkan kepada pengunjung.
4. Jangan ubah akses Spreadsheet menjadi **Anyone with the link**. Website harus membaca data melalui Apps Script yang menyaring isinya, bukan mengakses Spreadsheet langsung.
5. Jika membutuhkan pengumuman nilai, simpan nama lengkap, NPM lengkap, dan nilai sumber **hanya di Spreadsheet privat**.

## 4. Siapkan Google Apps Script

Website ini menggunakan dua jenis layanan yang berbeda:

| Layanan | Akses | Fungsi |
|---|---|---|
| **Portfolio Manager** | Khusus pemilik | Mengedit data, menyimpan draft, mengunggah media, dan menerbitkan konten |
| **Public Reader / Mailer** | Endpoint publik dengan fungsi yang dibatasi | Mengirimkan konten terbit, nilai yang disamarkan, formulir kontak, serta permintaan Guestbook |

1. Buka [script.google.com](https://script.google.com/) dan buat proyek Apps Script untuk **Portfolio Manager**.
2. Buat proyek Apps Script **terpisah** untuk **Public Reader / Mailer**.
3. Siapkan atau kembangkan kode backend Anda sendiri agar kedua layanan membaca Spreadsheet milik Anda. **Kode Apps Script lengkap tidak tersedia dalam repository ini**, sehingga langkah ini tidak bisa diselesaikan hanya dengan menyalin file HTML/JavaScript.
4. Pastikan Portfolio Manager hanya bisa dijalankan oleh akun yang memiliki izin. Jangan menerbitkan fungsi admin atau pengeditan database pada endpoint publik.
5. Untuk Public Reader, pilih **Deploy → New deployment → Web app**. Jika endpoint memang ditujukan untuk pengunjung umum, atur **Execute as: Me** dan **Who has access: Anyone**. Pastikan semua rute publik menerapkan daftar izin (*allowlist*) dan tidak bisa membaca atau menulis sembarang sheet.
6. Simpan URL Web App yang berakhiran `/exec` dari deployment tersebut.
7. Untuk update berikutnya gunakan **Deploy → Manage deployments → Edit → New version → Deploy** agar URL `/exec` tidak berubah.

### Respons minimum yang diperlukan website

`common.js` menggunakan iframe dan `postMessage`, **bukan** sekadar mengambil URL JSON biasa. Karena itu backend pengganti harus kompatibel dengan mekanisme tersebut:

- `GET ?action=published_site&nonce=...` → mengembalikan data konten terbit yang diizinkan untuk publik.
- `GET ?action=published_grades&board=ID&nonce=...` → mengembalikan baris pengumuman yang masih berlaku dan **sudah disamarkan di server**.
- Respons iframe mengirim `postMessage` bertipe `ASJ_PUBLISHED_V46`, dengan `requestId` yang sama seperti `nonce`, `kind` (`site` atau `grades`), `ok`, dan `data` atau `message`.
- Backend harus mengirim pesan **hanya ke origin website Anda**, misalnya `https://<username>.github.io`, bukan memakai wildcard `*` untuk informasi yang perlu dibatasi.
- Data `published_site` minimal berbentuk objek dengan `profile` dan, jika dipakai, array `experiences`, `projects`, `publications`, `otherActivities`, `portalLinks`, `courses`, `tools`, serta `gradeBoards`.

Jika menggunakan adaptasi backend yang memiliki konstanta `PM46R.parent`, ubah nilainya ke domain GitHub Pages milik Anda agar respons bisa diterima halaman sendiri.

## 5. Hubungkan website ke API Anda

1. Buka file **`common.js`** pada repository Anda.
2. Temukan baris konstanta:

   ```javascript
   const PM46_PUBLIC_API = 'https://script.google.com/macros/s/.../exec';
   ```

3. Ganti URL tersebut dengan **URL `/exec` milik Public Reader Anda sendiri**.
4. Simpan perubahan (**Commit changes**).
5. Refresh website. Jika koneksi benar dan data sudah dipublikasikan, konten akan dimuat otomatis.
6. Jika gagal, periksa respons Web App, rute `published_site`, domain tujuan `postMessage`, dan akses Spreadsheet.

**Wajib:** jangan menggunakan endpoint yang sudah tertulis dalam salinan `common.js`. Endpoint itu merupakan konfigurasi website asal; bukan endpoint bersama untuk para pengguna template.

## 6. Ganti identitas dan isi portofolio

1. Pada backend/Portfolio Manager Anda, isi data profil, deskripsi, lokasi, institusi, pendidikan, dan sertifikasi.
2. Tambahkan **Experiences**, **Projects & Studies**, **Publications**, dan **Other Activities** sesuai kebutuhan.
3. Isi judul serta deskripsi **Academic Services**, **Courses & Materials**, dan **Digital Tools** apabila fitur tersebut ingin ditampilkan.
4. Untuk tampilan bahasa Inggris, sertakan versi teks `en` pada data yang ingin diterjemahkan. Jika tidak ada, website akan menggunakan teks utama.
5. Ganti logo, favicon, foto, dan tautan institusi pada HTML/konfigurasi. Periksa juga tautan tetap yang mungkin masih ada dalam `index.html` atau `portfolio.js`.
6. Gunakan **Save** untuk menyimpan draft, lalu **Publish** untuk memperbarui konten terbit. Perubahan Save saja tidak otomatis harus menjadi data publik.
7. Bila suatu fitur dinonaktifkan (**OFF**), pastikan backend **tidak memasukkan data fitur tersebut ke respons publik**. Jangan hanya menyembunyikannya memakai CSS.

## 7. Atur foto, ikon, dan dokumen

1. Unggah foto yang ingin ditampilkan ke penyimpanan Drive/media milik sendiri.
2. Simpan ID atau URL media tersebut pada data backend.
3. Pastikan foto publik dapat dimuat oleh browser **tanpa login**, lalu cek dengan jendela Incognito.
4. Ikon ringan boleh disimpan di `assets/icons/` agar cepat ditampilkan. Ganti ikon dan logo bawaan yang tidak ingin digunakan.
5. Jangan mengunggah dokumen privat, foto asli yang tidak boleh disebar, atau file nilai mahasiswa ke repository GitHub publik.
6. Ingat bahwa gambar yang tampak pada website publik **tetap dapat disalin pengunjung**, meskipun file fisiknya disimpan di Google Drive.

## 8. Aktifkan Contact, Guestbook, dan unduhan (opsional)

1. Siapkan endpoint pengiriman pesan milik Anda sendiri untuk fitur **Mail Me**. Konfigurasikan URL tersebut melalui field `contactFormUrl` pada data profil.
2. Jika menggunakan **Digital Tools** atau **Courses & Materials** dengan formulir Guestbook, siapkan endpoint `toolGuestbookUrl` serta tabel Guestbook privat milik Anda.
3. Simpan URL file unduhan asli di Spreadsheet/backend, **bukan** di GitHub maupun respons daftar Tools/Materials.
4. Setelah formulir valid, backend boleh memberikan URL unduhan yang sesuai. Untuk file Google Drive, mekanisme unduhan langsung hanya dapat bekerja apabila izin file dan kebijakan Google mengizinkan.
5. `v46-download.js` mengatur tampilan tombol dan pesan proses download. File ini **tidak menggantikan backend Guestbook**.
6. Jika tidak menyiapkan endpoint Contact/Guestbook, jangan mengaktifkan fitur yang membutuhkan endpoint tersebut.

## 9. Atur pengumuman nilai (opsional)

1. Masukkan data nilai ke Spreadsheet privat, bukan ke `assets/grades/`.
2. Tentukan mata kuliah, kelas, periode, kolom yang boleh ditampilkan, dan masa tayang pengumuman.
3. Pada backend, samarkan nama dan NPM **sebelum** mengirim respons `published_grades`.
4. Batasi respons API hanya untuk pengumuman yang aktif dan belum kedaluwarsa.
5. Jangan kirim NPM lengkap, nama lengkap, atau lembar nilai sumber ke browser.
6. Pastikan tidak ada file JSON nilai tersimpan di repository GitHub. Data yang sudah disamarkan tetapi diumumkan secara publik juga tetap dapat disalin dan mungkin masih dapat mengidentifikasi seseorang.

## 10. Pengujian sebelum membagikan website

Lakukan pengujian menggunakan **Incognito** atau browser yang tidak login ke akun Google Anda:

- [ ] Halaman utama terbuka tanpa error.
- [ ] Halaman `/academic.html` terbuka.
- [ ] Informasi profil, pengalaman, proyek, publikasi, dan kegiatan tampil dari database milik sendiri.
- [ ] Logo, ikon, foto profil, proyek, dan slideshow tampil.
- [ ] Tombol **ID / EN** berfungsi.
- [ ] Bagian yang dinonaktifkan tidak muncul **dan tidak dikirim dalam respons API**.
- [ ] Jika diaktifkan, Mail Me dapat mengirim pesan ke penerima milik sendiri.
- [ ] Jika diaktifkan, Guestbook menyimpan data ke Spreadsheet milik sendiri dan tombol unduhan berfungsi.
- [ ] Jika diaktifkan, pengumuman nilai hanya menampilkan identitas tersamarkan serta berhenti saat masa tayang berakhir.
- [ ] Di GitHub tidak ada file nilai, data buku tamu, token, kata sandi, maupun URL unduhan privat.

## 11. Jika terjadi masalah

| Gejala | Yang perlu diperiksa |
|---|---|
| Halaman tampil, tetapi isi portofolio kosong | `PM46_PUBLIC_API` di `common.js`, deployment `/exec`, respons `published_site`, dan apakah konten sudah Publish |
| Data yang tampil masih milik website asal | `common.js` masih menggunakan endpoint lama; ganti dengan backend Anda sendiri |
| Website menunggu lalu muncul pesan gagal memuat | Origin `postMessage` di backend, akses Apps Script, nonce, dan kesesuaian format respons |
| Foto tidak tampil | Izin berbagi file Drive, URL gambar, dan tab **Network** di Developer Tools |
| Academic Portal kosong | Data belum diaktifkan, belum dipublikasikan, atau backend mengirim daftar kosong |
| Pengumuman nilai tidak muncul | ID pengumuman, tanggal kedaluwarsa, status publikasi, atau rute `published_grades` |
| Mail Me / Guestbook gagal | Endpoint milik sendiri, otorisasi Apps Script, serta hak akses Spreadsheet |
| GitHub Pages menampilkan 404 | Nama repository, keberadaan `index.html` di root, dan **Settings → Pages** |

Untuk penggunaan di repository bernama selain `<username>.github.io`, periksa kembali seluruh path absolut seperti `/academic` dan `/v46-download.js`; file ini disiapkan dengan asumsi website dipasang pada root domain GitHub Pages.

---

by as.jawwad 2026
