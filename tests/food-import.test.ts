import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import {
  buildEditedFoodPreview,
  parseDecimalInput,
  parseFoodWorkbook,
} from "@/lib/import/food-import";

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
    const preview = buildEditedFoodPreview([
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
    ]);
    expect(preview.errorRows).toBe(0);
    expect(preview.incompleteRows).toBe(1);
    expect(preview.rows[0].nutrients.FAT).toBe(3.492);
  });
});
