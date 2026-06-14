# Arsitektur Sistem

## Komponen

- Next.js 15 App Router untuk UI dan route handler.
- Better Auth untuk credential session.
- Prisma ORM dan PostgreSQL untuk data relasional serta snapshot JSON.
- Engine TOPSIS TypeScript murni di `src/lib/topsis`.
- ExcelJS dan csv-parse untuk impor.
- pdf-lib dan ExcelJS untuk export.

## Alur Request

1. Better Auth memvalidasi cookie sesi.
2. `getCurrentUser` membaca role dan status terbaru dari database.
3. RBAC memeriksa permission endpoint.
4. Zod/parser memvalidasi payload.
5. Service menjalankan transaksi dan menulis audit.
6. UI menerima data atau error terstruktur.

## Batas Role

`ADMIN` hanya memiliki domain akun dan observabilitas. `USER` memiliki domain master data dan operasional TOPSIS. Pemeriksaan dilakukan di navigasi, server page, dan API agar menyembunyikan menu bukan satu-satunya kontrol keamanan.

## Model Data Utama

- `User`, `Session`, `Account`: autentikasi, role tunggal, dan status akun.
- `Criterion`, `Guideline`, `CriterionGuideline`: konfigurasi dan sumber.
- `Food`, `FoodNutrient`: nilai gizi nullable per 100 gram.
- `ImportRun`: histori preview/commit.
- `RankingRun`, `RankingResult`: snapshot kalkulasi dan justifikasi.
- `AuditLog`, `HealthCheck`: observabilitas.

Soft delete dipertahankan pada master data, tetapi tidak ditampilkan sebagai status operasional.

## Konsistensi Ranking

Ranking tidak dihitung dari seed statis. Service membaca database aktif, menyaring makanan lengkap, menjalankan pure engine, lalu menyimpan seluruh input dan output sebagai snapshot. Laporan historis menggunakan snapshot tersebut agar tidak berubah ketika master data diedit.

## Keamanan

- Password di-hash oleh Better Auth.
- Akun selain `ACTIVE` ditolak pada hook pembuatan sesi.
- Tidak ada registrasi Admin publik.
- Endpoint export dan mutasi memeriksa permission.
- Secret dan connection string hanya berasal dari environment.
