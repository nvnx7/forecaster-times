import { z } from "zod";

import { editionSchema } from "./edition";
import { marketReferenceSchema } from "./market";

export const storyCategorySchema = z.enum([
  "world",
  "politics",
  "money",
  "technology",
  "crypto",
  "sports",
  "culture",
  "oddities",
]);
const paragraphBlockSchema = z.discriminatedUnion("type", [
  z.object({ type: z.literal("paragraph"), text: z.string() }),
  z.object({ type: z.literal("pullquote"), text: z.string() }),
  z.object({ type: z.literal("subheading"), text: z.string() }),
]);
const marketPanelSchema = z.object({
  marketId: z.string(),
  question: z.string(),
  marketReference: marketReferenceSchema.optional(),
  yes: z.number(),
  no: z.number(),
  change24h: z.number().optional(),
  volume24hUsd: z.number().optional(),
  liquidityUsd: z.number().optional(),
  openInterestUsd: z.number().optional(),
  tradeUrl: z.string().optional(),
  placement: z.enum(["float-left", "float-right", "full-width"]).optional(),
});
const generatedBySchema = z.object({
  provider: z.string(),
  model: z.string(),
});
export const storySchema = z.object({
  id: z.string(),
  category: storyCategorySchema,
  kicker: z.string().optional(),
  headline: z.object({
    long: z.string(),
    medium: z.string(),
    short: z.string(),
  }),
  dek: z.string().optional(),
  body: z.array(paragraphBlockSchema),
  byline: z.string().optional(),
  market: marketPanelSchema.optional(),
  illustration: z
    .object({
      src: z.string(),
      alt: z.string(),
      caption: z.string().optional(),
      credit: z.string().optional(),
      placement: z.enum(["wide", "float-left", "float-right"]).optional(),
      aspectRatio: z.enum(["3:2", "4:5", "1:1"]).optional(),
      asset: z
        .object({
          objectKey: z.string(),
          contentType: z.string(),
          preset: z.enum([
            "frontLeadWide",
            "categoryLeadWide",
            "categoryLeadPortrait",
            "secondaryWide",
            "secondarySquare",
          ]),
          generatedBy: generatedBySchema.optional(),
        })
        .optional(),
    })
    .optional(),
  generatedBy: generatedBySchema.optional(),
  meta: z
    .object({
      publishedAt: z.string().optional(),
      updatedAt: z.string().optional(),
      sourceLabel: z.string().optional(),
    })
    .optional(),
});

export const frontPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  edition: editionSchema,
  leadStory: storySchema,
  secondaryStories: z.array(storySchema),
  briefs: z.array(
    z.object({
      id: z.string(),
      category: storyCategorySchema,
      headline: z.string(),
      summary: z.string().optional(),
      probability: z.number().optional(),
      change24h: z.number().optional(),
      market: marketReferenceSchema,
    }),
  ),
  hotMarkets: z.array(
    z.object({
      market: marketReferenceSchema,
      probability: z.number(),
      change24h: z.number().optional(),
    }),
  ),
});
