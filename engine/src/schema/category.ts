import { z } from "zod";

export const categoryPageIdSchema = z.enum([
  "world-politics",
  "money-markets",
  "technology-culture",
  "sports",
  "odds-oddities",
]);

export const categoryLayoutVariantSchema = z.enum([
  "category-lead",
  "dense",
  "visual-lead",
  "market-heavy",
]);
