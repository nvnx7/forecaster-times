import { z } from "zod";

/** Minimal edition identity stored by every published page and resumable draft. */
export const editionSchema = z.object({
  id: z.number().int().positive(),
  now: z.string().datetime(),
});
