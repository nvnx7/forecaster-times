import { z } from "zod";

import { categoryLayoutVariantSchema, categoryPageIdSchema } from "./category";
import { editionSchema } from "./edition";
import { storyCategorySchema, storySchema } from "./front-page";
import { marketReferenceSchema } from "./market";

const categoryStorySchema = storySchema.extend({
  continuation: z
    .object({ label: z.string(), pageNumber: z.number().int().positive() })
    .optional(),
});

const categoryBriefSchema = z.object({
  id: z.string(),
  category: storyCategorySchema,
  kicker: z.string().optional(),
  headline: z.string(),
  summary: z.string().optional(),
  probability: z.number().optional(),
  change24h: z.number().optional(),
  market: marketReferenceSchema.optional(),
});

const categorySidebarSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("changes"),
    title: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        previousProbability: z.number(),
        probability: z.number(),
        change: z.number(),
      }),
    ),
  }),
  z.object({
    type: z.literal("movers"),
    title: z.string(),
    items: z.array(
      z.object({
        id: z.string(),
        label: z.string(),
        probability: z.number(),
        change24h: z.number(),
      }),
    ),
  }),
  z.object({
    type: z.literal("odds"),
    title: z.string(),
    items: z.array(
      z.object({ id: z.string(), label: z.string(), probability: z.number() }),
    ),
  }),
  z.object({ type: z.literal("text"), title: z.string(), body: z.string() }),
]);

export const categoryPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  category: z.object({
    id: categoryPageIdSchema,
    label: z.string(),
    shortLabel: z.string().optional(),
    description: z.string().optional(),
  }),
  edition: editionSchema,
  layoutVariant: categoryLayoutVariantSchema,
  leadStory: categoryStorySchema,
  secondaryStories: z.array(categoryStorySchema),
  briefs: z.array(categoryBriefSchema),
  sidebar: categorySidebarSchema.optional(),
  marketBoard: z
    .object({
      title: z.string(),
      subtitle: z.string().optional(),
      items: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          probability: z.number(),
          change24h: z.number().optional(),
          volume24hUsd: z.number().optional(),
          market: marketReferenceSchema,
        }),
      ),
    })
    .optional(),
  footerStories: z.array(categoryBriefSchema).optional(),
});
