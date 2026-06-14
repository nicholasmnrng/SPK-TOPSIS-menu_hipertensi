import { z } from "zod";
import { parseDecimalInput } from "@/lib/import/food-import";

const decimal = z.preprocess(
  (value) => parseDecimalInput(value),
  z.number().finite().nonnegative(),
);

export const criterionSchema = z.object({
  code: z.string().trim().min(2).max(50).transform((value) => value.toUpperCase()),
  name: z.string().trim().min(2).max(100),
  description: z.string().trim().max(500).optional().nullable(),
  unit: z.string().trim().min(1).max(20),
  weight: decimal.refine((value) => value > 0 && value <= 1, {
    message: "Bobot harus lebih dari 0 dan maksimal 1.",
  }),
  attribute: z.enum(["BENEFIT", "COST"]),
});

export const criteriaWeightSchema = z.object({
  items: z.array(
    z.object({
      id: z.string().min(1),
      weight: decimal.refine((value) => value > 0 && value <= 1),
      attribute: z.enum(["BENEFIT", "COST"]),
    }),
  ).min(1),
}).superRefine((value, context) => {
  const total = value.items.reduce((sum, item) => sum + item.weight, 0);
  if (Math.abs(total - 1) > 0.000001) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      message: `Total bobot harus tepat 100%. Saat ini ${(total * 100).toFixed(2)}%.`,
      path: ["items"],
    });
  }
});

export type CriterionInput = z.infer<typeof criterionSchema>;
