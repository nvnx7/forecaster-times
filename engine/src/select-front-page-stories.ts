import type { PolymarketMarket } from "./types";

const secondaryStoryCount = 2;
const briefCount = 3;

export type FrontPageStorySelection = {
  leadMarket?: PolymarketMarket;
  secondaryMarkets: PolymarketMarket[];
  briefMarkets: PolymarketMarket[];
  hotMarkets: PolymarketMarket[];
};

/** Current policy: rank front-page coverage by 24-hour market volume. */
export function selectFrontPageStories(
  markets: PolymarketMarket[],
): FrontPageStorySelection {
  const hotMarkets = [...markets].sort(
    (first, second) => (second.volume_24hr ?? 0) - (first.volume_24hr ?? 0),
  );
  const [leadMarket, ...remainingMarkets] = hotMarkets;

  return {
    leadMarket,
    secondaryMarkets: remainingMarkets.slice(0, secondaryStoryCount),
    briefMarkets: remainingMarkets.slice(
      secondaryStoryCount,
      secondaryStoryCount + briefCount,
    ),
    hotMarkets,
  };
}
