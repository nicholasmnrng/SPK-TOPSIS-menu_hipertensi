import { z } from "zod";
import { NUTRIENT_CODES, parseDecimalInput } from "@/lib/import/food-import";

const nullableDecimal = z.preprocess(
  (value) => parseDecimalInput(value),
  z.number().finite().nonnegative().nullable(),
);

export const foodSchema = z.object({
  name: z.string().trim().min(2).max(240),
  description: z.string().trim().max(1000).optional().nullable(),
  nutrients: z.object(
    Object.fromEntries(NUTRIENT_CODES.map((code) => [code, nullableDecimal])) as Record<
      (typeof NUTRIENT_CODES)[number],
      typeof nullableDecimal
    >,
  ),
});

export type FoodInput = z.infer<typeof foodSchema>;
