import { z } from "zod";

const storySectionSchema = z.enum([
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
  yes: z.number(),
  no: z.number(),
  change24h: z.number().optional(),
  volume24hUsd: z.number().optional(),
  liquidityUsd: z.number().optional(),
  openInterestUsd: z.number().optional(),
  tradeUrl: z.string().optional(),
  placement: z.enum(["float-left", "float-right", "full-width"]).optional(),
});

const illustrationSchema = z.object({
  src: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  credit: z.string().optional(),
  placement: z.enum(["wide", "float-left", "float-right"]).optional(),
});

const storySchema = z.object({
  id: z.string(),
  section: storySectionSchema,
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
  illustration: illustrationSchema.optional(),
  meta: z
    .object({
      publishedAt: z.string().optional(),
      updatedAt: z.string().optional(),
      sourceLabel: z.string().optional(),
    })
    .optional(),
});

const briefSchema = z.object({
  id: z.string(),
  section: storySectionSchema,
  headline: z.string(),
  summary: z.string().optional(),
  probability: z.number().optional(),
  change24h: z.number().optional(),
});

const sidebarSchema = z.discriminatedUnion("type", [
  z.object({
    type: z.literal("movers"),
    title: z.string(),
    items: z.array(
      z.object({
        label: z.string(),
        probability: z.number(),
        change24h: z.number(),
      }),
    ),
  }),
  z.object({
    type: z.literal("odds"),
    title: z.string(),
    items: z.array(z.object({ label: z.string(), probability: z.number() })),
  }),
  z.object({ type: z.literal("text"), title: z.string(), body: z.string() }),
]);

export const frontPageSchema = z.object({
  pageNumber: z.number().int().positive(),
  edition: z.object({
    id: z.string(),
    date: z.string(),
    displayDate: z.string(),
    editionLabel: z.string().optional(),
    tagline: z.string().optional(),
  }),
  leadStory: storySchema,
  secondaryStories: z.array(storySchema),
  briefs: z.array(briefSchema),
  marketStrip: z
    .object({
      title: z.string(),
      items: z.array(
        z.object({
          id: z.string(),
          label: z.string(),
          probability: z.number(),
          change24h: z.number().optional(),
        }),
      ),
    })
    .optional(),
  sidebar: sidebarSchema.optional(),
  footerStories: z.array(storySchema).optional(),
});
