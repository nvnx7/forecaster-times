import { z } from "zod";

export const draftStateSchema = z.object({
  version: z.literal(1),
  editionId: z.number().int().positive(),
  startedAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const latestEditionSchema = z.object({
  editionId: z.number().int().positive(),
  publishedAt: z.string().datetime(),
});
