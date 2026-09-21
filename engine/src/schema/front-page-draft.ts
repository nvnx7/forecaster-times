import { z } from "zod";
import { editionSchema } from "./edition";
import { storySchema } from "./front-page";
import { polymarketMarketSchema, storySourceSchema } from "./market";

export const pageDraftSchema = z.object({
  version: z.literal(1),
  edition: editionSchema,
  marketCandidates: z.array(polymarketMarketSchema),
  briefMarkets: z.array(polymarketMarketSchema),
  stories: z.array(
    z.object({
      market: polymarketMarketSchema,
      sources: z.array(storySourceSchema).min(1),
      story: storySchema.optional(),
      attemptCount: z.number().int().nonnegative(),
      lastError: z.string().optional(),
      illustrationAttemptCount: z.number().int().nonnegative().optional(),
      illustrationLastError: z.string().optional(),
    }),
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});

export const frontPageDraftSchema = pageDraftSchema;
