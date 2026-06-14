# UI/UX

## Navigasi Admin

- Dashboard
- Akun
- Monitoring
- Audit Log
- Profil

Dashboard berfokus pada akun pending/aktif, sesi, aktivitas, dan status database. Admin tidak melihat tombol edit data gizi.

## Navigasi Ahli Gizi

- Dashboard
- Master Kriteria
- Master Pedoman
- Data Makanan
- Ranking
- Laporan
- Profil

## Alur Registrasi

1. Pengguna membuka `/register`.
2. Sistem membuat akun pending.
3. Login ditolak sampai Admin menyetujui.
4. Admin membuka Akun dan memilih Setujui.
5. Pengguna login dan masuk ke dashboard operasional.

## Data Makanan

Halaman `/foods` memiliki:

- Upload `.xlsx`/`.csv`.
- Preview editable seluruh baris.
- Statistik total, valid, incomplete, dan error.
- Form input manual desimal.
- Tabel lima nilai dan status kelengkapan.

Input menggunakan `inputMode=decimal`, bukan batas skor 1-5. Tanda `-` dan kosong tampil sebagai belum lengkap.

## Ranking

Halaman ranking menampilkan chart, tabel `D+`, `D-`, `Vi`, riwayat run, dan tombol hitung ulang. Detail run menampilkan:

- Bobot snapshot.
- Justifikasi per makanan.
- Maksimal tiga kekuatan dan dua kehati-hatian.
- Matriks mentah, normalisasi, dan terbobot.
- Pedoman serta disclaimer.

## Laporan

Tombol PDF dan Excel berupa link download ke endpoint nyata. Tombol dinonaktifkan secara konseptual dengan empty state ketika belum ada ranking.

## Bahasa

Gunakan "peringkat TOPSIS berdasarkan konfigurasi kriteria", bukan "makanan paling sehat". Semua tampilan hasil menyertakan konteks per 100 gram dan disclaimer klinis.
