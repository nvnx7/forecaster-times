import { z } from "zod";

import type { MarketPanel } from "@/types";

export const polymarketGammaApiUrl = "https://gamma-api.polymarket.com";

const gammaMarketSchema = z.object({
  id: z.coerce.string(),
  question: z.string(),
  slug: z.string().optional(),
  outcomes: z.string(),
  outcomePrices: z.string(),
  oneDayPriceChange: z.number().optional(),
  volume24hr: z.number().optional(),
  liquidityNum: z.number().optional(),
});

function parseOutcomeValues(value: string, field: string) {
  const parsed = z
    .array(z.union([z.string(), z.number()]))
    .safeParse(JSON.parse(value));
  if (!parsed.success) throw new Error(`Invalid Gamma ${field}.`);
  return parsed.data;
}

export function toMarketPanelFromGamma(
  source: unknown,
  initialMarket: MarketPanel,
): MarketPanel {
  const market = gammaMarketSchema.parse(source);
  const outcomes = parseOutcomeValues(market.outcomes, "outcomes").map(String);
  const prices = parseOutcomeValues(market.outcomePrices, "outcome prices").map(
    Number,
  );
  const yesIndex = outcomes.findIndex(
    (outcome) => outcome.toLowerCase() === "yes",
  );
  const noIndex = outcomes.findIndex(
    (outcome) => outcome.toLowerCase() === "no",
  );
  const yes = prices[yesIndex];
  const no = prices[noIndex];

  if (yes === undefined || !Number.isFinite(yes)) {
    throw new Error("Gamma market has no Yes price.");
  }

  return {
    ...initialMarket,
    marketId: market.id,
    question: market.question,
    marketReference: {
      ...initialMarket.marketReference,
      marketId: market.id,
      question: market.question,
      slug: market.slug ?? initialMarket.marketReference?.slug,
      tags: initialMarket.marketReference?.tags ?? [],
    },
    yes,
    no: no !== undefined && Number.isFinite(no) ? no : 1 - yes,
    change24h: market.oneDayPriceChange,
    volume24hUsd: market.volume24hr,
    liquidityUsd: market.liquidityNum,
  };
}
