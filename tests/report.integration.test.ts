import ExcelJS from "exceljs";
import { afterAll, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db/prisma";
import { buildRankingPdf, buildRankingWorkbook } from "@/lib/export/report";
import {
  calculateActiveDataRanking,
  RankingJustification,
} from "@/server/services/topsis-service";

describe("ranking snapshot and exports", () => {
  afterAll(async () => {
    await prisma.$disconnect();
  });

  it("persists deterministic justification and creates non-empty reports", async () => {
    const user = await prisma.user.findFirstOrThrow();
    const ranking = await calculateActiveDataRanking(user.id);
    expect(ranking).not.toBeNull();
    const first = ranking!.results[0];
    const justification = first.justification as unknown as RankingJustification;
    expect(justification.strengths.length).toBeGreaterThan(0);
    expect(justification.disclaimer).toContain("tidak menggantikan pertimbangan klinis");
    expect(
      justification.strengths.some((factor) => factor.guidelineCodes.length > 0),
    ).toBe(true);
    expect(justification.strengths[0].idealContribution).toBeGreaterThanOrEqual(0);
    expect(justification.strengths[0].idealContribution).toBeLessThanOrEqual(1);

    const pdf = await buildRankingPdf(ranking!);
    expect(pdf.subarray(0, 4).toString()).toBe("%PDF");
    expect(pdf.length).toBeGreaterThan(1000);

    const xlsx = await buildRankingWorkbook(ranking!);
    expect(xlsx.subarray(0, 2).toString()).toBe("PK");
    expect(xlsx.length).toBeGreaterThan(5000);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(xlsx as unknown as ExcelJS.Buffer);
    expect(workbook.worksheets.map((sheet) => sheet.name)).toEqual([
      "Ringkasan",
      "Ranking",
      "Data Gizi",
      "Perhitungan TOPSIS",
      "Pedoman",
    ]);
    expect(workbook.getWorksheet("Ranking")?.getRow(1).values).toEqual([
      undefined,
      "Rank",
      "Makanan",
      "Vi",
      "Ringkasan",
      "Kekuatan",
      "Catatan",
    ]);
    expect(workbook.getWorksheet("Perhitungan TOPSIS")?.getRow(1).values).toEqual([
      undefined,
      "Rank",
      "Makanan",
      "Vi",
      "Nilai Normalisasi",
      "Nilai Terbobot",
    ]);
  });
});
