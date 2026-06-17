# REST API

Semua endpoint selain registrasi, auth, dan health memerlukan cookie sesi Better Auth. Error berbentuk:

```json
{ "error": { "code": "VALIDATION_ERROR", "message": "Data tidak valid." } }
```

## Publik dan Auth

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/api/register` | Membuat akun `USER/ACTIVE` |
| GET/POST | `/api/auth/[...all]` | Better Auth |
| GET | `/api/health` | Status API/database dan latensi |

## Admin

| Method | Endpoint | Permission |
| --- | --- | --- |
| GET | `/api/admin/accounts` | `users:manage` |
| POST | `/api/admin/accounts` | Activate, suspend, reset password, revoke session |
| GET | `/api/admin/monitoring` | `monitoring:read` |
| GET | `/api/admin/audit-logs` | `audit:read` |

Payload aksi akun:

```json
{ "action": "APPROVE", "userId": "..." }
```

Nilai `action`: `APPROVE` untuk mengaktifkan akun pending lama, `SUSPEND`, `ACTIVATE`, `RESET_PASSWORD`, `REVOKE_SESSIONS`.

## Kriteria dan Pedoman

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET/POST/PUT | `/api/criteria` | List, tambah, dan simpan konfigurasi bobot |
| PATCH/DELETE | `/api/criteria/:id` | Edit atau soft delete |
| GET/POST | `/api/guidelines` | List dan tambah pedoman |
| PATCH/DELETE | `/api/guidelines/:id` | Edit atau soft delete |

Bobot disimpan sebagai pecahan, misalnya 20% adalah `0.2`, dan total harus `1`.

## Data Makanan

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| GET/POST | `/api/foods` | List dan tambah makanan |
| PATCH/DELETE | `/api/foods/:id` | Edit atau soft delete |
| POST | `/api/foods/import/preview` | Upload multipart `.xlsx`/`.csv` |
| POST | `/api/foods/import/commit` | Commit file atau rows hasil preview editable |

Contoh input manual:

```json
{
  "name": "Contoh Makanan",
  "description": null,
  "nutrients": {
    "PROTEIN": "12,75",
    "FAT": 4.2,
    "CARBOHYDRATE": 130,
    "FIBER": null,
    "SODIUM": 220
  }
}
```

## Ranking dan Laporan

| Method | Endpoint | Fungsi |
| --- | --- | --- |
| POST | `/api/topsis/calculate` | Kalkulasi dan simpan snapshot |
| GET | `/api/rankings/latest` | Ranking terbaru |
| GET | `/api/rankings/:id` | Detail snapshot dan `justification` |
| GET | `/api/reports/rankings.pdf?rankingRunId=...` | PDF nyata |
| GET | `/api/reports/rankings.xlsx?rankingRunId=...` | XLSX nyata |

Route lama `/api/alternatives` dan `/api/assessments` tidak lagi menjadi kontrak data. UI lama diarahkan ke `/foods`.
