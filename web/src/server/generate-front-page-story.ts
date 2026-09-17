import type { PolymarketMarket, Story } from "@/types";

/**
 * Reserved for the editorial generation step that runs before an edition is
 * published to object storage. It must not run in a reader-facing request.
 */
export async function generateFrontPageStory(
  _market: PolymarketMarket,
): Promise<Story | null> {
  return null;
}
