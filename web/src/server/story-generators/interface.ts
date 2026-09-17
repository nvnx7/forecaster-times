import type { PolymarketMarket, Story } from "@/types";

export type StoryGeneratorInput = {
  market: PolymarketMarket;
};

/** All editorial model providers must implement this contract. */
export interface StoryGenerator {
  generateStory(input: StoryGeneratorInput): Promise<Story>;
}
