import type { PolymarketMarket } from "../types";

export const frontPageSecondaryStoryCount = 2;
const frontPageBriefCount = 3;

/** Current policy: rank front-page coverage candidates by 24-hour volume. */
export function rankFrontPageMarketCandidates(
  markets: PolymarketMarket[],
): PolymarketMarket[] {
  return [...markets].sort(
    (first, second) => (second.volume_24hr ?? 0) - (first.volume_24hr ?? 0),
  );
}

export function selectFrontPageBriefMarkets(
  candidates: PolymarketMarket[],
  featuredMarkets: PolymarketMarket[],
): PolymarketMarket[] {
  const featuredMarketIds = new Set(
    featuredMarkets.map((market) => market.market_id),
  );

  return candidates
    .filter((market) => !featuredMarketIds.has(market.market_id))
    .slice(0, frontPageBriefCount);
}
