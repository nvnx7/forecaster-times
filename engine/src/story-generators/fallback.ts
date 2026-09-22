import { GenerationError } from "../generation";
import { logger } from "../logger";
import type {
  GeneratedBy,
  PolymarketMarket,
  Story,
  StorySource,
} from "../types";
import type { StoryGenerator } from "./interface";

export type FallbackStoryGeneratorOptions = {
  generators: readonly StoryGenerator[];
};

/** Tries configured story generators in order until one produces a valid story. */
export class FallbackStoryGenerator implements StoryGenerator {
  readonly generatedBy: GeneratedBy = {
    provider: "fallback-router",
    model: "ordered",
  };

  constructor(private readonly options: FallbackStoryGeneratorOptions) {
    if (options.generators.length === 0) {
      throw new Error(
        "FallbackStoryGenerator requires at least one generator.",
      );
    }
  }

  async generateStory(
    market: PolymarketMarket,
    sources: readonly StorySource[],
  ): Promise<Story> {
    for (const [index, generator] of this.options.generators.entries()) {
      try {
        return await generator.generateStory(market, sources);
      } catch (error) {
        const failure = error instanceof GenerationError ? error : undefined;
        logger.warn("Story generation candidate failed", {
          marketId: market.market_id,
          provider: generator.generatedBy.provider,
          model: generator.generatedBy.model,
          kind: failure?.details.kind ?? "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
        });

        if (!failure?.details.fallbackEligible) throw error;
        const next = this.options.generators[index + 1];
        if (!next) throw error;

        logger.info("Story generation fallback attempted", {
          marketId: market.market_id,
          from: generator.generatedBy,
          to: next.generatedBy,
        });
      }
    }

    throw new Error("All story generation candidates failed.");
  }
}
