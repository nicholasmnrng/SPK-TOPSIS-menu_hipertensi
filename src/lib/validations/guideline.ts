import { z } from "zod";

export const guidelineSchema = z.object({
  code: z.string().trim().min(2).max(100),
  title: z.string().trim().min(5).max(300),
  issuer: z.string().trim().min(2).max(200),
  year: z.coerce.number().int().min(1900).max(2100),
  url: z.string().url(),
  summary: z.string().trim().min(10).max(2000),
  criterionIds: z.array(z.string().min(1)).default([]),
});
