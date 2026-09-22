import type {
  GeneratedBy,
  PolymarketMarket,
  Story,
  StorySource,
} from "../types";

/** Contract implemented by every provider-backed editorial story generator. */
export interface StoryGenerator {
  readonly generatedBy: GeneratedBy;

  generateStory(
    market: PolymarketMarket,
    sources: readonly StorySource[],
  ): Promise<Story>;
}
