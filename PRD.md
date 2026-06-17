# PRD: SPK TOPSIS Makanan untuk Hipertensi

## 1. Tujuan

Sistem membantu Ahli Gizi membandingkan makanan menggunakan TOPSIS berdasarkan kandungan protein, lemak, karbohidrat, serat, dan natrium per 100 gram. Sistem menyajikan hasil yang dapat diaudit, justifikasi deterministik, sumber pedoman, dan laporan yang dapat diunduh.

Sistem tidak menyatakan satu makanan sebagai "makanan paling sehat". Istilah yang digunakan adalah "peringkat TOPSIS berdasarkan konfigurasi kriteria".

## 2. Role

### ADMIN

- Mengelola akun Ahli Gizi.
- Menangguhkan atau mengaktifkan kembali akun.
- Mereset password dan mencabut sesi.
- Melihat monitoring, audit log, health status, dan riwayat proses.
- Tidak dapat mengubah kriteria, pedoman, data gizi, ranking, atau laporan operasional.

### USER (Ahli Gizi)

- Mengelola kriteria dan master pedoman.
- Mengelola dan mengimpor data makanan.
- Menjalankan TOPSIS, melihat detail, dan mengekspor laporan.
- Tidak dapat mengakses akun, monitoring, atau audit log.

Setiap akun hanya memiliki satu role. Registrasi publik selalu membuat `USER/ACTIVE`. Sesi baru hanya boleh dibuat untuk akun `ACTIVE`.

## 3. Kriteria Awal

| Kode | Nama | Bobot | Atribut | Satuan per 100 g |
| --- | --- | ---: | --- | --- |
| PROTEIN | Protein | 20% | BENEFIT | g |
| FAT | Lemak | 15% | COST | g |
| CARBOHYDRATE | Karbohidrat | 10% | BENEFIT | g |
| FIBER | Serat | 25% | BENEFIT | g |
| SODIUM | Natrium | 30% | COST | mg |

Bobot wajib positif dan totalnya tepat 100%. Semua kriteria yang tidak dihapus digunakan. Tidak ada input urutan atau status aktif.

## 4. Pedoman

Master pedoman menyimpan nomor/kode, judul, penerbit, tahun, URL, ringkasan, dan relasi ke kriteria.

- KMK HK.01.07/MENKES/4634/2021 untuk tata laksana hipertensi dewasa, pembatasan natrium, dan prinsip DASH.
- Permenkes Nomor 28 Tahun 2019 untuk Angka Kecukupan Gizi masyarakat Indonesia.

Pedoman digunakan sebagai konteks narasi, bukan sebagai klaim bahwa satu porsi otomatis memenuhi AKG.

## 5. Data Makanan dan Impor

Halaman `/foods` menggabungkan fitur Alternatif dan Penilaian. Setiap baris berisi nama makanan dan lima nilai gizi.

- Input menerima `12,75`, `12.75`, dan angka di atas 100.
- Nilai harus finite dan nonnegatif.
- Sel kosong atau `-` disimpan sebagai `null`.
- Data tidak lengkap tetap tersimpan tetapi tidak masuk perhitungan.
- Impor menerima `.xlsx` dan `.csv`.
- Alur: upload, preview editable, validasi, konfirmasi, transaksi database.
- Upsert menggunakan nama yang dinormalisasi agar impor ulang tidak membuat duplikasi.
- Nilai `3.492` tetap `3.492`, bukan `3492`.

Seed hanya membaca sheet `data clean` pada `docs/spk_topsis_k.xlsx`: 52 makanan, 50 calculation-ready, dan 2 incomplete.

## 6. TOPSIS dan Justifikasi

Engine membaca PostgreSQL dan hanya memakai makanan dengan seluruh nilai lengkap. Tahapan:

1. Matriks keputusan `X`.
2. Normalisasi `r_ij = x_ij / sqrt(sum(x_ij^2))`.
3. Pembobotan `y_ij = w_j * r_ij`.
4. Solusi ideal positif dan negatif berdasarkan BENEFIT/COST.
5. Jarak Euclidean `D+` dan `D-`.
6. Preferensi `V_i = D- / (D+ + D-)`.
7. Urutkan `V_i` dari terbesar.

Setiap kalkulasi menyimpan snapshot kriteria, pedoman, matriks, solusi ideal, hasil, dan justifikasi. Justifikasi membandingkan nilai makanan terhadap median dataset, memilih maksimal tiga kekuatan dan dua catatan kehati-hatian, lalu mencantumkan kode sumber.

Baseline data awal: `Kwaci` peringkat pertama dengan `V_i` sekitar `0.726210`.

Disclaimer wajib:

> Peringkat menggunakan kandungan gizi per 100 gram dan konfigurasi bobot saat perhitungan. Hasil bukan diagnosis, tidak otomatis menunjukkan kepatuhan asupan harian, dan tidak menggantikan pertimbangan klinis tenaga kesehatan.

## 7. Laporan

PDF memuat metadata ranking, konfigurasi bobot, hasil, nilai mentah, justifikasi, disclaimer, dan sumber.

XLSX memuat sheet:

- `Ringkasan`
- `Ranking`
- `Data Gizi`
- `Perhitungan TOPSIS`
- `Pedoman`

Endpoint harus memeriksa permission, mengembalikan MIME type dan nama file yang benar, serta mencatat audit export.

## 8. Monitoring dan Audit

Sistem mencatat registrasi, login, aktivasi/suspend, reset password, pencabutan sesi, CRUD penting, impor, kalkulasi, export, health check, dan error sistem.

Dashboard Admin menampilkan jumlah akun, sesi aktif, latensi dan status database/API, proses impor/ranking/export, aktivitas terbaru, dan error terakhir. Tanpa scheduler eksternal, histori health bertambah saat endpoint monitoring/health dipanggil.

## 9. Kriteria Penerimaan

- Registrasi Ahli Gizi langsung menghasilkan akun ACTIVE yang dapat login.
- RBAC Admin dan User saling terpisah.
- Parser menemukan 52/50/2 sesuai workbook.
- Angka koma, titik, dan di atas 100 diterima.
- Impor ulang tidak menduplikasi makanan.
- Baseline `Kwaci ~= 0.726210`.
- Justifikasi berisi faktor, sumber, dan disclaimer.
- PDF diawali `%PDF`; XLSX valid dan memiliki lima sheet wajib.
- Prisma validation, typecheck, unit/integration test, build, dan browser E2E lulus.
