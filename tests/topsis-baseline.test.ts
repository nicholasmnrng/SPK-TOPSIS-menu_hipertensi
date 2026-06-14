import fs from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { NUTRIENT_CODES, parseFoodWorkbook } from "@/lib/import/food-import";
import { calculateTopsis } from "@/lib/topsis";

const criteria = [
  { id: "PROTEIN", code: "PROTEIN", name: "Protein", weight: 0.2, attribute: "BENEFIT" as const },
  { id: "FAT", code: "FAT", name: "Lemak", weight: 0.15, attribute: "COST" as const },
  { id: "CARBOHYDRATE", code: "CARBOHYDRATE", name: "Karbohidrat", weight: 0.1, attribute: "BENEFIT" as const },
  { id: "FIBER", code: "FIBER", name: "Serat", weight: 0.25, attribute: "BENEFIT" as const },
  { id: "SODIUM", code: "SODIUM", name: "Natrium", weight: 0.3, attribute: "COST" as const },
];

describe("TOPSIS workbook baseline", () => {
  it("ranks Kwaci first at the approved baseline", async () => {
    const preview = await parseFoodWorkbook(
      await fs.readFile(path.join(process.cwd(), "docs", "spk_topsis_k.xlsx")),
    );
    const alternatives = preview.rows
      .filter((row) => NUTRIENT_CODES.every((code) => row.nutrients[code] !== null))
      .map((row) => ({
        id: row.normalizedName,
        name: row.name,
        scores: Object.fromEntries(
          NUTRIENT_CODES.map((code) => [code, row.nutrients[code] as number]),
        ),
      }));
    const result = calculateTopsis({ criteria, alternatives });
    expect(result.results).toHaveLength(50);
    expect(result.results[0].alternativeName).toBe("Kwaci");
    expect(result.results[0].preference).toBeCloseTo(0.726210, 6);
  });
});
