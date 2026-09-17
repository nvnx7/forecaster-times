import { geminiStoryGenerator } from "@/server/story-generators/gemini";
import type { PolymarketMarket, Story } from "@/types";

/**
 * Generates a lead story during the edition-publication workflow only.
 */
export async function generateFrontPageStory(
  market: PolymarketMarket,
): Promise<Story> {
  return geminiStoryGenerator.generateStory({ market });
}

/** Image generation is deliberately deferred from the editorial workflow. */
export async function generateFrontPageStoryImage(): Promise<null> {
  return null;
}
