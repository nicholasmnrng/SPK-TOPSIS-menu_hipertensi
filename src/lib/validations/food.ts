import { z } from "zod";
import { NUTRIENT_CODES } from "@/lib/import/food-import";

const nullableDecimal = z.unknown().transform((value, context) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") {
    if (Number.isFinite(value) && value >= 0) return value;
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Masukkan angka nonnegatif atau kosong.",
    });
    return z.NEVER;
  }

  const text = String(value).trim();
  if (!text || text === "-") return null;

  const normalized = text.includes(",") && !text.includes(".")
    ? text.replace(",", ".")
    : text.replace(/\s/g, "");
  const parsed = Number(normalized);

  if (Number.isFinite(parsed) && parsed >= 0) return parsed;

  context.addIssue({
    code: z.ZodIssueCode.custom,
    message: "Masukkan angka nonnegatif atau kosong.",
  });
  return z.NEVER;
});

type FoodCriterion = {
  code: string;
};

export function buildFoodSchema(criteria: FoodCriterion[]) {
  const nutrientFields = Object.fromEntries(
    criteria.map((criterion) => [criterion.code, nullableDecimal]),
  ) as Record<string, typeof nullableDecimal>;

  return z.object({
    name: z.string().trim().min(2).max(240),
    description: z.string().trim().max(1000).optional().nullable(),
    nutrients: z.object(nutrientFields),
  });
}

export const foodSchema = buildFoodSchema(NUTRIENT_CODES.map((code) => ({ code })));

export type FoodInput = z.infer<typeof foodSchema>;
