import type { GroqAIClient } from "../clients";
import type { EditorialEngineConfig } from "../config";
import { logger } from "../logger";
import type {
  GeneratedBy,
  PolymarketMarket,
  Story,
  StorySource,
} from "../types";
import type { StoryGenerator } from "./interface";
import { createGeneratedStorySchema, createStoryPrompt } from "./story";

const newsroomSystemPrompt =
  "You are the careful editor of Probability Press, a vintage-style newspaper covering prediction markets.";

export type GroqStoryGeneratorOptions = {
  client: GroqAIClient;
  config: EditorialEngineConfig;
};

/** Groq-backed implementation of the editorial story-generator contract. */
export class GroqStoryGenerator implements StoryGenerator {
  private readonly storySchema: ReturnType<typeof createGeneratedStorySchema>;

  constructor(private readonly options: GroqStoryGeneratorOptions) {
    this.storySchema = createGeneratedStorySchema();
  }

  readonly generatedBy: GeneratedBy = {
    provider: "groq",
    model: "openai/gpt-oss-120b",
  };

  async generateStory(
    market: PolymarketMarket,
    sources: readonly StorySource[],
  ): Promise<Story> {
    if (sources.length === 0) {
      throw new Error("Groq story generation requires at least one source.");
    }

    logger.debug("Groq story generation started", {
      marketId: market.market_id,
      sourceCount: sources.length,
    });

    try {
      const text = await this.options.client.prompt(
        createStoryPrompt(market, sources, this.options.config),
        {
          systemPrompt: newsroomSystemPrompt,
          temperature: 0.2,
          jsonMode: true,
          maxCompletionTokens: this.options.config.story.maxCompletionTokens,
        },
      );
      const generated = this.storySchema.parse(JSON.parse(text) as unknown);

      logger.debug("Groq story generation completed", {
        marketId: market.market_id,
        responseCharacters: text.length,
      });

      return {
        id: `story-${market.market_id}`,
        ...generated,
        generatedBy: this.generatedBy,
        meta: {
          publishedAt: new Date().toISOString(),
          sourceLabel: "Nansen Prediction Market",
        },
      };
    } catch (error) {
      logger.error("Groq story generation failed", {
        marketId: market.market_id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
