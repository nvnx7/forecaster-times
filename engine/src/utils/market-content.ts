import type {
  Brief,
  CategoryBrief,
  MarketPanel,
  MarketReference,
  PolymarketMarket,
  Story,
} from "../types";

import { getMarketProbability } from "./market";

export function toMarketReference(market: PolymarketMarket): MarketReference {
  return {
    marketId: market.market_id,
    question: market.question ?? "Untitled prediction market",
    slug: market.slug ?? undefined,
    eventId: market.event_id ?? undefined,
    eventTitle: market.event_title ?? undefined,
    active: market.active ?? undefined,
    closed: market.closed ?? undefined,
    endDate: market.end_date ?? undefined,
    negRisk: market.neg_risk ?? undefined,
    tags: market.tags ?? [],
    createdAt: market.created_at ?? undefined,
  };
}

export function toMarketPanel(market: PolymarketMarket): MarketPanel {
  const yes = getMarketProbability(market);

  return {
    marketId: market.market_id,
    question: market.question ?? "Untitled prediction market",
    marketReference: toMarketReference(market),
    yes,
    no: 1 - yes,
    change24h: market.one_day_price_change ?? undefined,
    volume24hUsd: market.volume_24hr ?? undefined,
    liquidityUsd: market.liquidity ?? undefined,
    openInterestUsd: market.open_interest ?? undefined,
    placement: "float-right",
  };
}

export function withMarketPanel(story: Story, market: PolymarketMarket): Story {
  return { ...story, market: toMarketPanel(market) };
}

export function toMarketBrief(market: PolymarketMarket): Brief {
  const probability = getMarketProbability(market);
  const change24h = market.one_day_price_change ?? undefined;
  const changeText =
    change24h === undefined
      ? ""
      : `, ${change24h >= 0 ? "up" : "down"} ${Math.abs(change24h * 100).toFixed(1)} points over 24 hours`;

  return {
    id: `brief-${market.market_id}`,
    category: "money",
    headline: market.question ?? "Untitled prediction market",
    summary: `Traders price this outcome at ${Math.round(probability * 100)}¢${changeText}.`,
    probability,
    change24h,
    market: toMarketReference(market),
  };
}

export function toCategoryBrief(
  market: PolymarketMarket,
  category: CategoryBrief["category"],
): CategoryBrief {
  const probability = getMarketProbability(market);
  return {
    id: `brief-${market.market_id}`,
    category,
    kicker: market.event_title ?? undefined,
    headline: market.question ?? "Untitled prediction market",
    summary: `Traders currently price this outcome at ${Math.round(probability * 100)}%.`,
    probability,
    change24h: market.one_day_price_change ?? undefined,
    market: toMarketReference(market),
  };
}
