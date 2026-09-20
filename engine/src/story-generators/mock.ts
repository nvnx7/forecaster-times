import type { PolymarketMarket, Story, StorySource } from "../types";
import type { StoryGenerator } from "./interface";

/** Deterministic generator for exercising the researched-story pipeline. */
export class MockStoryGenerator implements StoryGenerator {
  async generateStory(
    market: PolymarketMarket,
    sources: readonly StorySource[],
  ): Promise<Story> {
    const source = sources[0];
    if (!source) {
      throw new Error("Mock story generation requires at least one source.");
    }

    const headline =
      source.title ?? market.question ?? "Untitled prediction market";

    return {
      id: `story-${market.market_id}`,
      category: "world",
      kicker: market.event_title ?? "Latest News",
      headline: {
        long: headline,
        medium: headline,
        short: headline,
      },
      dek: source.description ?? undefined,
      body: [{ type: "paragraph", text: source.text }],
      byline: source.author ?? undefined,
      meta: {
        publishedAt: source.published_date ?? undefined,
        sourceLabel: source.title ?? source.final_url ?? source.url,
      },
    };
  }
}
