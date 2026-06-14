# Analisis Produk

## Masalah

Data makanan memiliki satuan dan rentang yang berbeda, sementara keputusan perlu mempertimbangkan beberapa kriteria sekaligus. Spreadsheet sumber juga memuat data kosong dan hidden sheet dengan formula rusak, sehingga aplikasi perlu sumber data yang jelas dan proses yang dapat diaudit.

## Pengguna

- Ahli Gizi: pemilik proses bisnis, master data, kalkulasi, interpretasi, dan laporan.
- Admin Sistem: pemilik akun, akses, audit, dan kesehatan teknis.

Pembagian ini menghindari Admin menjadi pengguna operasional dan menjaga tanggung jawab klinis berada pada Ahli Gizi.

## Keputusan Produk

- Gunakan sheet `data clean` sebagai sumber resmi.
- Gunakan angka gizi asli per 100 gram, bukan skor ordinal.
- Simpan data incomplete tanpa memaksakan imputasi.
- Gabungkan Alternatif dan Penilaian menjadi Data Makanan.
- Simpan setiap run sebagai snapshot untuk reproducibility.
- Berikan justifikasi berbasis median dan pedoman, bukan klaim kesehatan absolut.

## Risiko dan Mitigasi

| Risiko | Mitigasi |
| --- | --- |
| Satuan salah | Tampilkan unit di master, tabel, preview, dan laporan |
| Nilai kosong ikut dihitung | Filter kelengkapan sebelum engine |
| Bobot tidak konsisten | Validasi positif dan total 100% |
| Ranking dianggap diagnosis | Istilah netral dan disclaimer wajib |
| Workbook diimpor ulang | Upsert normalized name |
| Hasil berubah setelah edit | Snapshot input/output per run |

## Ukuran Keberhasilan

- Workbook terbaca 52 total, 50 ready, 2 incomplete.
- Tidak ada duplikasi saat reimport.
- Baseline Kwaci sekitar 0.726210.
- Laporan berisi data dan dapat dibuka.
- RBAC menolak akses lintas role.
