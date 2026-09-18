import type { PolymarketMarket, Story } from "../types";

/** Contract implemented by every provider-backed editorial story generator. */
export interface StoryGenerator {
  generateStory(market: PolymarketMarket): Promise<Story>;
}
