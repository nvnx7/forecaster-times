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

function parseOutcomePrices(value: string) {
  const parsed = z.array(z.coerce.number()).safeParse(JSON.parse(value));
  if (!parsed.success) throw new Error("Invalid Gamma outcome prices.");
  return parsed.data;
}

function parseOutcomeLabels(value: string) {
  const parsed = z.array(z.string().trim().min(1)).safeParse(JSON.parse(value));
  if (!parsed.success) throw new Error("Invalid Gamma outcomes.");
  return parsed.data;
}

export function toMarketPanelFromGamma(
  source: unknown,
  initialMarket: MarketPanel,
): MarketPanel {
  const market = gammaMarketSchema.parse(source);
  const [yesLabel, noLabel] = parseOutcomeLabels(market.outcomes);
  const [yes, no] = parseOutcomePrices(market.outcomePrices);

  if (
    yes === undefined ||
    no === undefined ||
    !Number.isFinite(yes) ||
    !Number.isFinite(no)
  ) {
    throw new Error("Gamma market has invalid outcome prices.");
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
    no,
    yesLabel,
    noLabel,
    change24h: market.oneDayPriceChange,
    volume24hUsd: market.volume24hr,
    liquidityUsd: market.liquidityNum,
  };
}
