import type { PolymarketMarket } from "../types";

type MarketSearchInput = Pick<PolymarketMarket, "event_title" | "question">;

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
    .replace(/^(will|would|can|could|is|are|does|do|did)\s+/i, "")
    .replace(/\s+/g, " ")
    .trim();

  const query = [market.event_title?.trim(), question, "latest news"]
    .filter(Boolean)
    .join(" ");

  return {
    query,
    purpose: `Find the recent news around ${query}`,
  };
}
