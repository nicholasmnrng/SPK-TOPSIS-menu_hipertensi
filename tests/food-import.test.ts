import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildEditedFoodPreview,
  parseDecimalInput,
  parseFoodCsv,
  parseFoodWorkbook,
} from "@/lib/import/food-import";
import { buildFoodSchema } from "@/lib/validations/food";

describe("food import parser", () => {
  it.each([
    ["12,75", 12.75],
    ["12.75", 12.75],
    ["3.492", 3.492],
    ["1250,5", 1250.5],
    [0, 0],
    ["-", null],
    ["", null],
  ])("parses %s as %s", (input, expected) => {
    expect(parseDecimalInput(input)).toBe(expected);
  });

  it.each([-1, "-2,5", "teks", Number.POSITIVE_INFINITY])("rejects invalid value %s", (input) => {
    expect(parseDecimalInput(input)).toBeNull();
  });

  it("rejects invalid manual nutrient input instead of storing it as empty", () => {
    const parsed = buildFoodSchema([
      { code: "PROTEIN" },
      { code: "FAT" },
      { code: "CARBOHYDRATE" },
      { code: "FIBER" },
      { code: "SODIUM" },
    ]).safeParse({
      name: "Contoh Manual",
      description: "",
      nutrients: {
        PROTEIN: "12,5",
        FAT: "-1",
        CARBOHYDRATE: "30",
        FIBER: "5",
        SODIUM: "100",
      },
    });

    expect(parsed.success).toBe(false);
  });

  it("parses dynamic criteria headers by code or name", () => {
    const preview = parseFoodCsv(
      "Nama Bahan Makanan,Protein,Kalium,VITC\nBayam,2.9,558,28\n",
      [
        { code: "PROTEIN", name: "Protein" },
        { code: "POTASSIUM", name: "Kalium" },
        { code: "VITC", name: "Vitamin C" },
      ],
    );

    expect(preview.errorRows).toBe(0);
    expect(preview.rows[0].nutrients).toEqual({
      PROTEIN: 2.9,
      POTASSIUM: 558,
      VITC: 28,
    });
  });

  it("reads 52 workbook rows and excludes only two incomplete foods", async () => {
    const file = await fs.readFile(path.join(process.cwd(), "docs", "spk_topsis_k.xlsx"));
    const preview = await parseFoodWorkbook(file);
    expect(preview.totalRows).toBe(52);
    expect(preview.validRows).toBe(52);
    expect(preview.incompleteRows).toBe(2);
    expect(preview.errorRows).toBe(0);
    expect(preview.validRows - preview.incompleteRows).toBe(50);
  });

  it("revalidates corrections made in preview", () => {
    const preview = buildEditedFoodPreview(
      [
        {
          rowNumber: 1,
          name: "Contoh",
          nutrients: {
            PROTEIN: "12,75",
            FAT: "3.492",
            CARBOHYDRATE: 120,
            FIBER: "-",
            SODIUM: 450,
          },
        },
      ],
      [
        { code: "PROTEIN", name: "Protein" },
        { code: "FAT", name: "Lemak" },
        { code: "CARBOHYDRATE", name: "Karbohidrat" },
        { code: "FIBER", name: "Serat" },
        { code: "SODIUM", name: "Natrium" },
      ],
    );
    expect(preview.errorRows).toBe(0);
    expect(preview.incompleteRows).toBe(1);
    expect(preview.rows[0].nutrients.FAT).toBe(3.492);
  });
});
