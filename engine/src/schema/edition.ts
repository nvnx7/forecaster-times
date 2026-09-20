import { z } from "zod";

/** Minimal edition identity stored by every published page and resumable draft. */
export const editionSchema = z.object({
  id: z.string(),
  now: z.string().datetime(),
});
