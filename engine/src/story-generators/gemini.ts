import axios, { type AxiosInstance } from "axios";
import axiosRetry from "axios-retry";

import type { EditorialEngineConfig } from "../config";
import { logger } from "../logger";
import type { PolymarketMarket, Story, StorySource } from "../types";
import { isRetryableRequestError, toLoggableResponse } from "../utils";
import type { StoryGenerator } from "./interface";
import { createGeneratedStorySchema, createStoryPrompt } from "./story";

type GeminiInteractionResponse = {
  id?: string;
  steps?: { type?: string; content?: { type?: string; text?: string }[] }[];
};

const generatedStoryJsonSchema = {
  type: "OBJECT",
  additionalProperties: false,
  required: ["section", "kicker", "headline", "dek", "body"],
  properties: {
    section: {
      type: "STRING",
      enum: [
        "world",
        "politics",
        "money",
        "technology",
        "crypto",
        "sports",
        "culture",
        "oddities",
      ],
    },
    kicker: { type: "STRING" },
    headline: {
      type: "OBJECT",
      additionalProperties: false,
      required: ["long", "medium", "short"],
      properties: {
        long: { type: "STRING" },
        medium: { type: "STRING" },
        short: { type: "STRING" },
      },
    },
    dek: { type: "STRING" },
    body: {
      type: "ARRAY",
      items: {
        oneOf: [
          {
            type: "OBJECT",
            additionalProperties: false,
            required: ["type", "text"],
            properties: {
              type: { type: "STRING", enum: ["paragraph"] },
              text: { type: "STRING" },
            },
          },
          {
            type: "OBJECT",
            additionalProperties: false,
            required: ["type", "text"],
            properties: {
              type: { type: "STRING", enum: ["pullquote"] },
              text: { type: "STRING" },
            },
          },
          {
            type: "OBJECT",
            additionalProperties: false,
            required: ["type", "text"],
            properties: {
              type: { type: "STRING", enum: ["subheading"] },
              text: { type: "STRING" },
            },
          },
        ],
      },
    },
  },
} as const;

function extractText(response: GeminiInteractionResponse): string {
  const text = response.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("")
    .trim();
  if (!text) throw new Error("Gemini returned no generated story content.");
  return text;
}

export type GeminiStoryGeneratorOptions = {
  apiKey: string;
  model: string;
  config: EditorialEngineConfig;
};

/** Gemini-backed implementation of the editorial story-generator contract. */
export class GeminiStoryGenerator implements StoryGenerator {
  private readonly client: AxiosInstance;
  private readonly storySchema: ReturnType<typeof createGeneratedStorySchema>;

  constructor(private readonly options: GeminiStoryGeneratorOptions) {
    this.storySchema = createGeneratedStorySchema(options.config);
    this.client = axios.create({
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": options.apiKey,
        "api-revision": "2026-05-20",
      },
      timeout: options.config.generationTimeoutMs,
    });
    axiosRetry(this.client, {
      retries: options.config.generationRetryCount,
      retryCondition: isRetryableRequestError,
      retryDelay: (retryCount, error) =>
        axiosRetry.exponentialDelay(
          retryCount,
          error,
          options.config.generationRetryBaseDelayMs,
        ),
      shouldResetTimeout: false,
      onRetry: (retryCount, error) => {
        logger.warn("Gemini story generation retry scheduled", {
          retryCount,
          status: error.response?.status,
          message: error.message,
        });
      },
    });
  }

  async generateStory(
    market: PolymarketMarket,
    sources: readonly StorySource[],
  ): Promise<Story> {
    if (sources.length === 0) {
      throw new Error("Gemini story generation requires at least one source.");
    }

    logger.debug("Gemini story generation started", {
      model: this.options.model,
      marketId: market.market_id,
      timeoutMs: this.options.config.generationTimeoutMs,
    });
    try {
      const { data } = await this.client.post<GeminiInteractionResponse>(
        "/interactions",
        {
          model: this.options.model,
          input: createStoryPrompt(market, sources, this.options.config),
          store: false,
          response_format: [
            {
              type: "text",
              mime_type: "application/json",
              schema: generatedStoryJsonSchema,
            },
          ],
        },
      );
      const text = extractText(data);
      const generated = this.storySchema.parse(JSON.parse(text) as unknown);
      logger.debug("Gemini story generation completed", {
        marketId: market.market_id,
        interactionId: data.id,
        responseCharacters: text.length,
      });
      return {
        id: `story-${market.market_id}`,
        ...generated,
        meta: {
          publishedAt: new Date().toISOString(),
          sourceLabel: "Nansen Prediction Market",
        },
      };
    } catch (error) {
      logger.error("Gemini story generation failed", {
        marketId: market.market_id,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        responseBody: axios.isAxiosError(error)
          ? toLoggableResponse(error.response?.data)
          : undefined,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
