# SPK TOPSIS Makanan untuk Hipertensi

Aplikasi Next.js untuk membantu Ahli Gizi mengelola data kandungan gizi per 100 gram, menghitung peringkat dengan TOPSIS, menjelaskan faktor pendukung hasil, dan mengekspor laporan PDF/XLSX.

## Role dan Alur

- `ADMIN`: suspend/aktivasi akun, reset password, pencabutan sesi, audit log, dan monitoring teknis.
- `USER`: Ahli Gizi yang mengelola kriteria, pedoman, data makanan, impor, ranking, dan laporan.
- Registrasi publik selalu menghasilkan akun `USER` berstatus `ACTIVE`.
- Akun suspended tidak dapat membuat sesi. Admin dapat menonaktifkan atau mengaktifkan akun dari manajemen akun.

## Data Awal

Seed membaca sheet visible `data clean` dari `docs/spk_topsis_k.xlsx`.

- 52 makanan tersimpan.
- 50 makanan memiliki lima nilai lengkap dan dapat dihitung.
- 2 makanan memiliki nilai serat kosong dan dikeluarkan dari kalkulasi.
- Hidden sheet dan formula workbook tidak digunakan.

Nilai yang dipakai adalah angka desimal asli per 100 gram. Tidak ada konversi ke skor 1-5.

| Kriteria | Bobot | Atribut | Satuan |
| --- | ---: | --- | --- |
| Protein | 20% | BENEFIT | g |
| Lemak | 15% | COST | g |
| Karbohidrat | 10% | BENEFIT | g |
| Serat | 25% | BENEFIT | g |
| Natrium | 30% | COST | mg |

Baseline seed menempatkan `Kwaci` pada peringkat pertama dengan nilai sekitar `0.726210`.

## Menjalankan Aplikasi

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Salin `.env.example` ke `.env`, lalu isi koneksi PostgreSQL, secret Better Auth, dan kredensial Admin awal.

## Verifikasi

```bash
npm test
npm run typecheck
npx prisma validate
npm run build
# jalankan server production, lalu:
npm run test:e2e:http
```

## Dokumentasi

- [PRD](PRD.md)
- [Analisis Produk](docs/phase-1-product-analysis.md)
- [Arsitektur](docs/architecture.md)
- [API](docs/api.md)
- [UI/UX](docs/ui-ux.md)
- [Alur TOPSIS](docs/topsis-flow.md)
- [Setup](docs/setup-guide.md)
- [Status Implementasi](docs/phase-6-implementation.md)

Hasil merupakan peringkat TOPSIS berdasarkan konfigurasi kriteria. Nilai per 100 gram tidak otomatis menunjukkan kepatuhan asupan harian dan tidak menggantikan pertimbangan klinis tenaga kesehatan.
