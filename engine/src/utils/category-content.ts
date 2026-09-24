import type { CategoryPageConfig } from "../config";
import type { CategorySidebar, PolymarketMarket } from "../types";

import { getMarketProbability } from "./market";

export function createCategorySidebar(
  config: CategoryPageConfig,
  markets: PolymarketMarket[],
): CategorySidebar {
  const items = markets.slice(0, config.briefCount).map((market) => {
    const probability = getMarketProbability(market);
    const change = market.one_day_price_change ?? 0;
    return {
      id: market.market_id,
      label: market.question ?? "Untitled prediction market",
      probability,
      change24h: change,
      previousProbability: probability - change,
      change,
    };
  });
  if (config.sidebar.type === "changes") {
    return {
      type: "changes",
      title: config.sidebar.title,
      items: items.map(({ change24h: _change24h, ...item }) => item),
    };
  }
  if (config.sidebar.type === "movers") {
    return {
      type: "movers",
      title: config.sidebar.title,
      items: items.map(
        ({
          previousProbability: _previousProbability,
          change: _change,
          ...item
        }) => item,
      ),
    };
  }
  return {
    type: "odds",
    title: config.sidebar.title,
    items: items.map(
      ({
        previousProbability: _previousProbability,
        change24h: _change24h,
        change: _change,
        ...item
      }) => item,
    ),
  };
}
