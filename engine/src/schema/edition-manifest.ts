import { z } from "zod";

import { categoryPageIdSchema, pageIdSchema } from "./category";

export const editionManifestSchema = z.object({
  version: z.literal(1),
  editionId: z.number().int().positive(),
  createdAt: z.string().datetime(),
  publishedAt: z.string().datetime(),
  pages: z.array(
    z.discriminatedUnion("status", [
      z.object({
        id: pageIdSchema,
        status: z.literal("published"),
        objectKey: z.string(),
      }),
      z.object({
        id: categoryPageIdSchema,
        status: z.literal("skipped"),
        reason: z.string(),
      }),
    ]),
  ),
});
