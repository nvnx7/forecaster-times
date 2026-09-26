import type { ListPolymarketMarketsParams, PolymarketMarket } from "../types";

type MarketSearchInput = Pick<PolymarketMarket, "event_title" | "question">;

export function clampProbability(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

export function getMarketProbability(market: PolymarketMarket): number {
  if (market.last_trade_price != null) {
    return clampProbability(market.last_trade_price);
  }

  if (market.best_bid != null && market.best_ask != null) {
    return clampProbability((market.best_bid + market.best_ask) / 2);
  }

  return 0.5;
}

/** Rejects markets that Nansen explicitly marks as inactive or closed. */
export function isActiveMarket(market: PolymarketMarket): boolean {
  return market.active !== false && market.closed !== true;
}

export function sortMarkets(
  markets: PolymarketMarket[],
  orderBy: ListPolymarketMarketsParams["orderBy"],
): PolymarketMarket[] {
  if (!orderBy?.length) return markets;

  return [...markets].sort((first, second) => {
    for (const { field, direction } of orderBy) {
      const difference = (first[field] ?? 0) - (second[field] ?? 0);
      if (difference !== 0)
        return direction === "ASC" ? difference : -difference;
    }
    return 0;
  });
}

export function generateMarketSearchString(market: MarketSearchInput): {
  query: string;
  purpose: string;
} {
  if (!market.question?.trim()) {
    throw new Error("A market question is required to generate a news query.");
  }

  const question = market.question
    .toLowerCase()
    .trim()
    .replace(/\?+$/g, "")
    .replace(/^(will|which|who|would|can|could|is|are|does|do|did)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  // const query = [market.event_title?.trim(), question, "latest news"]
  const query = [question, "latest news"].filter(Boolean).join(" ");

  return {
    query,
    purpose: `Find the recent news around ${query}`,
  };
}
