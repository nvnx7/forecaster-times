import { z } from "zod";

/** Nansen's persisted prediction-market shape, including live fields in drafts. */
export const polymarketMarketSchema = z.object({
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

export const polymarketMarketOhlcvCandleSchema = z.object({
  market_id: z.string(),
  token_id: z.string(),
  side: z.string(),
  outcome_index: z.number(),
  period_start: z.string(),
  open: z.number(),
  high: z.number(),
  low: z.number(),
  close: z.number(),
  volume_usd: z.number(),
  trade_count: z.number().int(),
  unique_traders: z.number().int(),
});

/** Immutable market context retained in a published editorial document. */
export const marketReferenceSchema = z.object({
  marketId: z.string(),
  question: z.string(),
  slug: z.string().optional(),
  eventId: z.string().optional(),
  eventTitle: z.string().optional(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  endDate: z.string().optional(),
  negRisk: z.boolean().optional(),
  tags: z.array(z.string()),
  createdAt: z.string().optional(),
});

/** A fetched TinyFish source persisted for an editorial story draft. */
export const storySourceSchema = z.object({
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
