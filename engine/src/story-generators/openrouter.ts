import { type OpenRouterAIClient, OpenRouterAIError } from "../clients";
import type { EditorialEngineConfig } from "../config";
import { GenerationError, isSafetyBlockedError } from "../generation";
import { logger } from "../logger";
import type {
  GeneratedBy,
  PolymarketMarket,
  Story,
  StorySource,
} from "../types";
import { wordCount } from "../utils";
import type { StoryGenerator } from "./interface";
import { createGeneratedStorySchema, createStoryPrompt } from "./story";

export type OpenRouterStoryGeneratorOptions = {
  client: OpenRouterAIClient;
  config: EditorialEngineConfig;
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
};

function describeTextField(value: unknown) {
  return typeof value === "string"
    ? { text: value, wordCount: wordCount(value) }
    : { valueType: typeof value };
}

function getResponseDiagnostics(text: string) {
  try {
    const response = JSON.parse(text) as unknown;
    if (typeof response !== "object" || response === null) {
      return { responseType: typeof response };
    }

    const fields = response as Record<string, unknown>;
    return {
      kicker: describeTextField(fields.kicker),
      dek: describeTextField(fields.dek),
    };
  } catch {
    return { responseType: "invalid-json" };
  }
}

/** Generates structured Forecaster Times stories with GPT-OSS through OpenRouter. */
export class OpenRouterStoryGenerator implements StoryGenerator {
  private readonly storySchema: ReturnType<typeof createGeneratedStorySchema>;

  constructor(private readonly options: OpenRouterStoryGeneratorOptions) {
    this.storySchema = createGeneratedStorySchema();
  }

  get generatedBy(): GeneratedBy {
    return { provider: "openrouter", model: this.options.client.modelName };
  }

  async generateStory(
    market: PolymarketMarket,
    sources: readonly StorySource[],
  ): Promise<Story> {
    if (sources.length === 0) {
      throw new Error(
        "OpenRouter story generation requires at least one source.",
      );
    }

    logger.debug("OpenRouter story generation started", {
      ...this.generatedBy,
      marketId: market.market_id,
      sourceCount: sources.length,
    });

    try {
      const text = await this.options.client.prompt(
        createStoryPrompt(market, sources, this.options.config),
        {
          systemPrompt:
            "You are the careful news editor of Forecaster Times. Write concise, factual newspaper copy from supplied sources only. Preserve uncertainty and never invent facts, causes, quotes, or conclusions.",
          temperature: 0.2,
          jsonMode: true,
          // maxCompletionTokens: this.options.config.story.maxCompletionTokens,
          reasoningEffort: this.options.reasoningEffort,
        },
      );
      const generated = (() => {
        try {
          return this.storySchema.parse(JSON.parse(text) as unknown);
        } catch (error) {
          logger.error("OpenRouter story response failed validation", {
            ...this.generatedBy,
            marketId: market.market_id,
            responseJson: text,
            diagnostics: getResponseDiagnostics(text),
            message: error instanceof Error ? error.message : "Unknown error",
          });
          throw new GenerationError(
            "OpenRouter returned an invalid story response.",
            {
              generatedBy: this.generatedBy,
              kind: "invalid_output",
              fallbackEligible: true,
            },
          );
        }
      })();

      logger.debug("OpenRouter story generation completed", {
        ...this.generatedBy,
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
      logger.error("OpenRouter story generation failed", {
        ...this.generatedBy,
        marketId: market.market_id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      if (error instanceof GenerationError) throw error;

      const status =
        error instanceof OpenRouterAIError ? error.status : undefined;
      const kind = isSafetyBlockedError(error)
        ? "safety_blocked"
        : status === 429
          ? "rate_limited"
          : status !== undefined && status >= 500
            ? "unavailable"
            : "invalid_output";
      throw new GenerationError(
        error instanceof Error
          ? error.message
          : "OpenRouter story generation failed.",
        {
          generatedBy: this.generatedBy,
          kind,
          fallbackEligible: true,
        },
      );
    }
  }
}
