import ExcelJS from "exceljs";
import { PDFDocument, StandardFonts, rgb } from "pdf-lib";
import { getRanking } from "@/server/services/topsis-service";

type Ranking = NonNullable<Awaited<ReturnType<typeof getRanking>>>;

function safeText(value: unknown) {
  return String(value ?? "")
    .normalize("NFKD")
    .replace(/[^\x20-\x7E]/g, " ");
}

function wrap(text: string, maxLength: number) {
  const words = safeText(text).split(/\s+/);
  const lines: string[] = [];
  let current = "";
  for (const word of words) {
    if (`${current} ${word}`.trim().length > maxLength) {
      if (current) lines.push(current);
      current = word;
    } else {
      current = `${current} ${word}`.trim();
    }
  }
  if (current) lines.push(current);
  return lines;
}

export async function buildRankingPdf(ranking: Ranking) {
  const document = await PDFDocument.create();
  const regular = await document.embedFont(StandardFonts.Helvetica);
  const bold = await document.embedFont(StandardFonts.HelveticaBold);
  let page = document.addPage([595.28, 841.89]);
  let y = 800;

  const newPage = () => {
    page = document.addPage([595.28, 841.89]);
    y = 800;
  };
  const drawLine = (text: string, options: { bold?: boolean; size?: number; color?: ReturnType<typeof rgb> } = {}) => {
    const size = options.size ?? 9;
    if (y < 50) newPage();
    page.drawText(safeText(text), {
      x: 42,
      y,
      size,
      font: options.bold ? bold : regular,
      color: options.color ?? rgb(0.12, 0.15, 0.2),
    });
    y -= size + 5;
  };

  drawLine("LAPORAN RANKING TOPSIS MENU HIPERTENSI", { bold: true, size: 15, color: rgb(0.02, 0.45, 0.32) });
  drawLine(`Ranking Run: ${ranking.rankingRunId}`);
  drawLine(`Waktu: ${new Date(ranking.createdAt).toLocaleString("id-ID")}`);
  drawLine("");
  drawLine("Konfigurasi Kriteria", { bold: true, size: 11 });
  for (const criterion of ranking.criteriaSnapshot as Array<Record<string, unknown>>) {
    drawLine(
      `${criterion.name}: ${(Number(criterion.weight) * 100).toFixed(0)}% - ${criterion.attribute} - ${criterion.unit}`,
    );
  }

  drawLine("");
  drawLine("Hasil dan Justifikasi", { bold: true, size: 11 });
  for (const result of ranking.results) {
    const detail = result.detail as { scores: Record<string, number> };
    const justification = result.justification as {
      summary: string;
      strengths: Array<{ message: string }>;
      cautions: Array<{ message: string }>;
    };
    drawLine(
      `#${result.rank} ${result.foodName} | Vi ${result.preference.toFixed(6)} | D+ ${result.dPositive.toFixed(6)} | D- ${result.dNegative.toFixed(6)}`,
      { bold: true },
    );
    for (const line of wrap(
      `Nilai mentah per 100 g: ${(
        ranking.criteriaSnapshot as Array<{ id: string; name: string; unit: string }>
      ).map((criterion) => `${criterion.name} ${detail.scores[criterion.id]} ${criterion.unit}`).join("; ")}`,
      95,
    )) drawLine(line);
    for (const line of wrap(justification.summary, 95)) drawLine(line);
    for (const strength of justification.strengths) {
      for (const line of wrap(`Kekuatan: ${strength.message}`, 95)) drawLine(line);
    }
    for (const caution of justification.cautions) {
      for (const line of wrap(`Catatan: ${caution.message}`, 95)) drawLine(line);
    }
    y -= 5;
  }

  drawLine("Disclaimer", { bold: true, size: 11 });
  for (const line of wrap(ranking.disclaimer, 95)) drawLine(line);
  drawLine("");
  drawLine("Sumber Pedoman", { bold: true, size: 11 });
  for (const guideline of ranking.guidelineSnapshot as Array<Record<string, unknown>>) {
    for (const line of wrap(`${guideline.code} - ${guideline.title} (${guideline.url})`, 95)) {
      drawLine(line);
    }
  }

  return Buffer.from(await document.save());
}

export async function buildRankingWorkbook(ranking: Ranking) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SPK Menu Hipertensi";
  workbook.created = new Date();

  const summary = workbook.addWorksheet("Ringkasan");
  summary.addRows([
    ["Laporan Ranking TOPSIS Menu Hipertensi"],
    ["Ranking Run", ranking.rankingRunId],
    ["Waktu", new Date(ranking.createdAt)],
    ["Jumlah Makanan", ranking.results.length],
    ["Peringkat Pertama", ranking.results[0]?.foodName ?? "-"],
    [],
    ["Disclaimer"],
    [ranking.disclaimer],
  ]);
  summary.getColumn(1).width = 28;
  summary.getColumn(2).width = 90;
  summary.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF047857" } };
  summary.getCell("A7").font = { bold: true };
  summary.getCell("A8").alignment = { wrapText: true, vertical: "top" };

  const rankingSheet = workbook.addWorksheet("Ranking");
  rankingSheet.addRow(["Rank", "Makanan", "D+", "D-", "Vi", "Ringkasan", "Kekuatan", "Catatan"]);
  for (const result of ranking.results) {
    const justification = result.justification as {
      summary: string;
      strengths: Array<{ message: string }>;
      cautions: Array<{ message: string }>;
    };
    rankingSheet.addRow([
      result.rank,
      result.foodName,
      result.dPositive,
      result.dNegative,
      result.preference,
      justification.summary,
      justification.strengths.map((item) => item.message).join(" | "),
      justification.cautions.map((item) => item.message).join(" | "),
    ]);
  }
  rankingSheet.columns = [
    { width: 8 }, { width: 40 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 55 }, { width: 70 }, { width: 70 },
  ];
  rankingSheet.views = [{ state: "frozen", ySplit: 1 }];
  rankingSheet.autoFilter = "A1:H1";

  const nutrients = workbook.addWorksheet("Data Gizi");
  const criteria = ranking.criteriaSnapshot as Array<{ id: string; name: string; unit: string }>;
  nutrients.addRow(["Makanan", ...criteria.map((criterion) => `${criterion.name} (${criterion.unit}/100g)`)]);
  for (const result of ranking.results) {
    const detail = result.detail as { scores: Record<string, number> };
    nutrients.addRow([result.foodName, ...criteria.map((criterion) => detail.scores[criterion.id])]);
  }
  nutrients.getColumn(1).width = 45;
  criteria.forEach((_, index) => { nutrients.getColumn(index + 2).width = 18; });
  nutrients.views = [{ state: "frozen", ySplit: 1 }];
  nutrients.autoFilter = `A1:${String.fromCharCode(65 + criteria.length)}1`;

  const calculation = workbook.addWorksheet("Perhitungan TOPSIS");
  calculation.addRow(["Rank", "Makanan", "D+", "D-", "Vi", "Nilai Normalisasi", "Nilai Terbobot"]);
  for (const result of ranking.results) {
    const detail = result.detail as {
      normalized: Record<string, number>;
      weighted: Record<string, number>;
    };
    calculation.addRow([
      result.rank,
      result.foodName,
      result.dPositive,
      result.dNegative,
      result.preference,
      JSON.stringify(detail.normalized),
      JSON.stringify(detail.weighted),
    ]);
  }
  calculation.addRow([]);
  calculation.addRow(["Solusi Ideal Positif", "", "", "", "", JSON.stringify(ranking.idealPositive)]);
  calculation.addRow(["Solusi Ideal Negatif", "", "", "", "", JSON.stringify(ranking.idealNegative)]);
  calculation.columns = [
    { width: 8 }, { width: 40 }, { width: 14 }, { width: 14 },
    { width: 14 }, { width: 80 }, { width: 80 },
  ];
  calculation.views = [{ state: "frozen", ySplit: 1 }];

  const guidelines = workbook.addWorksheet("Pedoman");
  guidelines.addRow(["Kode", "Judul", "Penerbit", "Tahun", "URL", "Ringkasan"]);
  for (const guideline of ranking.guidelineSnapshot as Array<Record<string, unknown>>) {
    guidelines.addRow([
      guideline.code,
      guideline.title,
      guideline.issuer,
      guideline.year,
      guideline.url,
      guideline.summary,
    ]);
  }
  guidelines.columns = [
    { width: 32 }, { width: 65 }, { width: 40 }, { width: 10 }, { width: 75 }, { width: 90 },
  ];

  for (const worksheet of workbook.worksheets) {
    const header = worksheet.getRow(1);
    header.font = { bold: true, color: { argb: "FFFFFFFF" } };
    header.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF047857" } };
    worksheet.eachRow((row) => {
      row.alignment = { vertical: "top", wrapText: true };
    });
  }

  return Buffer.from(await workbook.xlsx.writeBuffer());
}
