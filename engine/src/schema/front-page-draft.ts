import { z } from "zod";

import { storySchema } from "./front-page";

const polymarketMarketSchema = z.object({
  market_id: z.string(),
  question: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  event_id: z.string().nullable().optional(),
  event_title: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  closed: z.boolean().nullable().optional(),
  end_date: z.string().nullable().optional(),
  neg_risk: z.boolean().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  volume: z.number().nullable().optional(),
  volume_24hr: z.number().nullable().optional(),
  volume_1wk: z.number().nullable().optional(),
  volume_1mo: z.number().nullable().optional(),
  liquidity: z.number().nullable().optional(),
  volume_change_pct: z.number().nullable().optional(),
  open_interest: z.number().nullable().optional(),
  best_bid: z.number().nullable().optional(),
  best_ask: z.number().nullable().optional(),
  last_trade_price: z.number().nullable().optional(),
  one_day_price_change: z.number().nullable().optional(),
  unique_traders_24h: z.number().int().nullable().optional(),
  created_at: z.string().nullable().optional(),
  age_hours: z.number().nullable().optional(),
});

const storySourceSchema = z.object({
  url: z.string(),
  final_url: z.string().nullable(),
  title: z.string().nullable(),
  description: z.string().nullable(),
  language: z.string().nullable(),
  format: z.literal("markdown"),
  text: z.string(),
  author: z.string().nullable().optional(),
  published_date: z.string().nullable().optional(),
});

export const frontPageDraftSchema = z.object({
  version: z.literal(1),
  edition: z.object({
    id: z.string(),
    now: z.string().datetime(),
  }),
  marketCandidates: z.array(polymarketMarketSchema),
  briefMarkets: z.array(polymarketMarketSchema),
  stories: z.array(
    z.object({
      market: polymarketMarketSchema,
      sources: z.array(storySourceSchema).min(1),
      story: storySchema.optional(),
      attemptCount: z.number().int().nonnegative(),
      lastError: z.string().optional(),
    }),
  ),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime(),
});
