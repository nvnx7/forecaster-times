import { z } from "zod";

export const pageIdSchema = z.enum([
  "front",
  "world-politics",
  "money-markets",
  "technology-culture",
  "sports",
  "crypto",
]);

export const categoryPageIdSchema = pageIdSchema.exclude(["front"]);

export const categoryLayoutVariantSchema = z.enum([
  "category-lead",
  "dense",
  "visual-lead",
  "market-heavy",
]);
