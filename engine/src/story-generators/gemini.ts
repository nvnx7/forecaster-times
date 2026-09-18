import axios, { type AxiosInstance } from "axios";
import axiosRetry from "axios-retry";
import { z } from "zod";

import type { EditorialEngineConfig } from "../config";
import { logger } from "../logger";
import type { PolymarketMarket, Story } from "../types";
import {
  isRetryableRequestError,
  toLoggableResponse,
  wordCount,
} from "../utils";
import type { StoryGenerator } from "./interface";

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

function boundedText(maxWords: number) {
  return z
    .string()
    .trim()
    .min(1)
    .refine((value) => wordCount(value) <= maxWords);
}

function createStorySchema(config: EditorialEngineConfig) {
  return z.object({
    section: z.enum([
      "world",
      "politics",
      "money",
      "technology",
      "crypto",
      "sports",
      "culture",
      "oddities",
    ]),
    kicker: boundedText(config.story.kickerMaxWords),
    headline: z.object({
      long: boundedText(config.story.headline.longMaxWords),
      medium: boundedText(config.story.headline.mediumMaxWords),
      short: boundedText(config.story.headline.shortMaxWords),
    }),
    dek: boundedText(config.story.dekMaxWords),
    body: z
      .array(
        z.discriminatedUnion("type", [
          z.object({
            type: z.literal("paragraph"),
            text: boundedText(config.story.body.paragraphMaxWords),
          }),
          z.object({
            type: z.literal("pullquote"),
            text: boundedText(config.story.body.pullquoteMaxWords),
          }),
          z.object({
            type: z.literal("subheading"),
            text: boundedText(config.story.body.subheadingMaxWords),
          }),
        ]),
      )
      .min(config.story.body.minBlocks)
      .max(config.story.body.maxBlocks)
      .refine(
        (blocks) =>
          blocks.reduce((total, block) => total + wordCount(block.text), 0) <=
          config.story.body.maxWords,
      ),
  });
}

function createPrompt(
  market: PolymarketMarket,
  config: EditorialEngineConfig,
): string {
  return `You are the careful editor of Probability Press, a vintage-style newspaper covering prediction markets.

Write a grounded editorial story from this Nansen market snapshot only:
${JSON.stringify(market)}

Rules:
- Treat every supplied value as market data, not proof of real-world events.
- Never invent causes, sources, quotes, outcomes, people, or external facts.
- Use cautious attribution such as "traders priced" or "the market implied".
- Return the requested JSON only. Do not use Markdown.
- Do not include market prices, market IDs, illustrations, bylines, metadata, or trade calls-to-action; the application owns those fields.

Copy limits:
- kicker: at most ${config.story.kickerMaxWords} words.
- headline.long: at most ${config.story.headline.longMaxWords} words.
- headline.medium: at most ${config.story.headline.mediumMaxWords} words.
- headline.short: at most ${config.story.headline.shortMaxWords} words.
- dek: at most ${config.story.dekMaxWords} words.
- body: ${config.story.body.minBlocks} to ${config.story.body.maxBlocks} blocks and at most ${config.story.body.maxWords} words in total.`;
}

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
  private readonly storySchema: ReturnType<typeof createStorySchema>;

  constructor(private readonly options: GeminiStoryGeneratorOptions) {
    this.storySchema = createStorySchema(options.config);
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

  async generateStory(market: PolymarketMarket): Promise<Story> {
    logger.info("Gemini story generation started", {
      model: this.options.model,
      marketId: market.market_id,
      timeoutMs: this.options.config.generationTimeoutMs,
    });
    try {
      const { data } = await this.client.post<GeminiInteractionResponse>(
        "/interactions",
        {
          model: this.options.model,
          input: createPrompt(market, this.options.config),
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
      logger.info("Gemini story generation completed", {
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
