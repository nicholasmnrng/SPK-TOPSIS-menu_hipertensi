import { z } from "zod";

export const topsisCalculateSchema = z.object({
  mode: z.enum(["ACTIVE_DATA", "DEMO"]).default("DEMO"),
});

export type TopsisCalculateInput = z.infer<typeof topsisCalculateSchema>;
