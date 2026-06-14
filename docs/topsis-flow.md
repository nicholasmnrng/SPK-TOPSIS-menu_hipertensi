# Alur TOPSIS

## Input

Engine menerima lima kriteria berbobot total 100% dan makanan dengan nilai lengkap. Satuan sumber adalah gram atau miligram per 100 gram. Data kosong tidak diimputasi dan makanan tersebut dikeluarkan dari run.

## Formula

Untuk makanan `i` dan kriteria `j`:

```text
r_ij = x_ij / sqrt(sum_i(x_ij^2))
y_ij = w_j * r_ij
```

Solusi ideal:

```text
BENEFIT: A+ = max(y), A- = min(y)
COST:    A+ = min(y), A- = max(y)
```

Jarak dan preferensi:

```text
D_i+ = sqrt(sum_j((y_ij - A_j+)^2))
D_i- = sqrt(sum_j((y_ij - A_j-)^2))
V_i  = D_i- / (D_i+ + D_i-)
```

Urutan descending `V_i`. Full precision disimpan, pembulatan hanya untuk tampilan.

## Justifikasi

Untuk tiap hasil:

1. Ambil nilai mentah setiap kriteria.
2. Bandingkan dengan median makanan lengkap pada run yang sama.
3. Arah favorable mengikuti BENEFIT/COST.
4. Urutkan faktor berdasarkan selisih relatif dari median.
5. Ambil tiga kekuatan dan maksimal dua kehati-hatian.
6. Sertakan kode pedoman yang berelasi dengan kriteria.

Narasi bersifat deterministik dan tidak menggunakan model generatif.

## Snapshot

`RankingRun` menyimpan kriteria, pedoman, matriks mentah, matriks normalisasi, matriks terbobot, solusi ideal, dan disclaimer. `RankingResult` menyimpan jarak, preferensi, detail nilai, dan justifikasi.

## Baseline

Workbook resmi menghasilkan 50 makanan calculation-ready. Dengan bobot awal, hasil pertama:

```text
Kwaci: 0.7262104113824646
```

## Disclaimer

Nilai per 100 gram tidak otomatis menunjukkan kepatuhan asupan harian. Peringkat tidak menggantikan diagnosis atau pertimbangan klinis.
