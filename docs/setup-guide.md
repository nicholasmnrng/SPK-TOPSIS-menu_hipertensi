# Setup Guide

## Prasyarat

- Node.js 20 atau lebih baru.
- PostgreSQL.
- File `docs/spk_topsis_k.xlsx`.

## Environment

```env
DATABASE_URL="postgresql://user:password@localhost:5432/spk_menu_hipertensi"
BETTER_AUTH_SECRET="secret-panjang-dan-acak"
BETTER_AUTH_URL="http://localhost:3000"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
ADMIN_NAME="Administrator"
ADMIN_EMAIL="admin@spk.local"
ADMIN_PASSWORD="ganti-password-kuat"
```

## Instalasi

```bash
npm install
npx prisma generate
npx prisma migrate deploy
npm run prisma:seed
npm run dev
```

Seed bersifat idempotent untuk Admin, kriteria, pedoman, makanan, dan nilai gizi. Seed menambahkan histori import baru setiap dijalankan.

## Format Impor

Sheet XLSX yang diprioritaskan bernama `data clean`. CSV dan XLSX harus memiliki header:

```text
Nama Bahan Makanan, Protein, Lemak, Karbohidrat, Serat, Natrium
```

Aturan:

- Protein, lemak, karbohidrat, serat dalam gram per 100 g.
- Natrium dalam miligram per 100 g.
- Desimal titik dan koma diterima.
- Kosong atau `-` berarti belum lengkap.
- Angka negatif, teks, NaN, dan infinity ditolak.
- File lock Excel `~$*.xlsx` diabaikan Git dan tidak boleh dipilih sebagai sumber.

## Akun

Admin awal berasal dari environment. Ahli Gizi mendaftar melalui `/register`, lalu Admin menyetujui dari `/accounts`.

## Validasi Lokal

```bash
npm test
npm run typecheck
npx prisma validate
npm run build
```

Expected baseline:

```text
foods=52
calculation-ready=50
incomplete=2
top=Kwaci
Vi~=0.726210
```

## Catatan Migrasi

Migration `20260615000000_simplify_roles` mengganti schema demo lama. Pada database development yang memiliki drift, gunakan backup terlebih dahulu dan terapkan migration dengan `prisma migrate deploy`; jangan melakukan reset pada database berisi data penting.
