import type { PolymarketMarket, Story, StorySource } from "../types";

/** Contract implemented by every provider-backed editorial story generator. */
export interface StoryGenerator {
  generateStory(
    market: PolymarketMarket,
    sources: readonly StorySource[],
  ): Promise<Story>;
}
