import type { PolymarketMarket } from "../types";

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
