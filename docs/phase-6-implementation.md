# Status Implementasi

## Selesai

- Better Auth credential session dan penolakan akun nonaktif.
- Role tunggal `ADMIN`/`USER` beserta RBAC page dan API.
- Registrasi Ahli Gizi langsung aktif dan tindakan akun Admin.
- Schema Prisma redesign dan migration.
- Seed 52 makanan dari workbook resmi.
- Master kriteria dan pedoman.
- Data Makanan gabungan, input desimal, impor XLSX/CSV, preview editable, dan upsert.
- TOPSIS dari PostgreSQL dengan snapshot.
- Justifikasi deterministik, sumber, dan disclaimer.
- PDF dengan pdf-lib dan XLSX lima sheet dengan ExcelJS.
- Audit log, health endpoint, dan monitoring Admin.
- Unit/integration test parser, engine, RBAC, justifikasi, PDF, dan XLSX.

## Route UI

### Publik

- `/`
- `/login`
- `/register`
- `/pending`

### Admin

- `/dashboard`
- `/accounts`
- `/monitoring`
- `/audit-logs`
- `/settings`

### Ahli Gizi

- `/dashboard`
- `/criteria`
- `/guidelines`
- `/foods`
- `/rankings`
- `/rankings/:id`
- `/reports`
- `/settings`

Route `/alternatives`, `/assessments`, dan `/rankings/demo` diarahkan ke alur baru.

## Verifikasi Baseline

- Prisma schema valid.
- TypeScript typecheck lulus.
- 17 test lulus.
- E2E HTTP lulus untuk registrasi aktif, RBAC, PDF, dan XLSX.
- Database berisi 52 makanan dan 260 nilai.
- 2 makanan incomplete.
- Kwaci berada di peringkat pertama dengan `0.7262104113824646`.

## Operasional Lanjutan

Health history bertambah ketika endpoint dipanggil. Untuk uptime sampling yang benar-benar periodik di production, panggil `/api/health` dari scheduler platform.
