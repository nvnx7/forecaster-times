import { z } from "zod";

import type { MarketPanel } from "@/types";

export type LiveMarketPanel = MarketPanel & {
  outcomeTokenIds?: [string, string];
  tradingStatus?: "closed" | "inactive" | "orders-paused";
};

export const polymarketGammaApiUrl = "https://gamma-api.polymarket.com";

const gammaMarketSchema = z.object({
  id: z.coerce.string(),
  question: z.string(),
  slug: z.string().optional(),
  outcomes: z.string(),
  outcomePrices: z.string(),
  clobTokenIds: z.string().optional(),
  active: z.boolean().optional(),
  closed: z.boolean().optional(),
  acceptingOrders: z.boolean().optional(),
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

function parseOutcomeTokenIds(value: string | undefined) {
  if (!value) return undefined;

  const parsed = z.array(z.string().trim().min(1)).safeParse(JSON.parse(value));
  if (!parsed.success || parsed.data.length < 2) return undefined;
  return [parsed.data[0], parsed.data[1]] as [string, string];
}

export function getMarketTradingStatus(market: LiveMarketPanel) {
  if (market.tradingStatus) return market.tradingStatus;
  if (market.marketReference?.closed) return "closed";
  if (market.marketReference?.active === false) return "inactive";
  return undefined;
}

export function getMarketTradingStatusLabel(market: LiveMarketPanel) {
  const status = getMarketTradingStatus(market);
  if (status === "closed") return "Market closed";
  if (status === "inactive") return "Market inactive";
  if (status === "orders-paused") return "Orders paused";
  return undefined;
}

export function toMarketPanelFromGamma(
  source: unknown,
  initialMarket: MarketPanel,
): LiveMarketPanel {
  const market = gammaMarketSchema.parse(source);
  const [yesLabel, noLabel] = parseOutcomeLabels(market.outcomes);
  const [yes, no] = parseOutcomePrices(market.outcomePrices);
  const tradingStatus = market.closed
    ? "closed"
    : market.active === false
      ? "inactive"
      : market.acceptingOrders === false
        ? "orders-paused"
        : undefined;

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
    outcomeTokenIds: parseOutcomeTokenIds(market.clobTokenIds),
    tradingStatus,
    change24h: market.oneDayPriceChange,
    volume24hUsd: market.volume24hr,
    liquidityUsd: market.liquidityNum,
  };
}
