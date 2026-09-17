import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import { editorialConfig } from "@/config/editorial";
import { geminiApiKey } from "@/config/env";
import { logger } from "@/lib/logger";
import type {
  StoryGenerator,
  StoryGeneratorInput,
} from "@/server/story-generators/interface";
import type { Story } from "@/types";

const geminiModel = "gemini-3.8-flash";

const wordCount = (value: string) =>
  value.trim().split(/\s+/).filter(Boolean).length;

function boundedText(maxWords: number) {
  return z
    .string()
    .trim()
    .min(1)
    .refine((value) => wordCount(value) <= maxWords, {
      message: `Must contain at most ${maxWords} words.`,
    });
}

const generatedStorySchema = z.object({
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
  kicker: boundedText(editorialConfig.story.kickerMaxWords),
  headline: z.object({
    long: boundedText(editorialConfig.story.headline.longMaxWords),
    medium: boundedText(editorialConfig.story.headline.mediumMaxWords),
    short: boundedText(editorialConfig.story.headline.shortMaxWords),
  }),
  dek: boundedText(editorialConfig.story.dekMaxWords),
  body: z
    .array(
      z.discriminatedUnion("type", [
        z.object({
          type: z.literal("paragraph"),
          text: boundedText(editorialConfig.story.body.paragraphMaxWords),
        }),
        z.object({
          type: z.literal("pullquote"),
          text: boundedText(editorialConfig.story.body.pullquoteMaxWords),
        }),
        z.object({
          type: z.literal("subheading"),
          text: boundedText(editorialConfig.story.body.subheadingMaxWords),
        }),
      ]),
    )
    .min(editorialConfig.story.body.minBlocks)
    .max(editorialConfig.story.body.maxBlocks)
    .refine(
      (blocks) =>
        blocks.reduce((total, block) => total + wordCount(block.text), 0) <=
        editorialConfig.story.body.maxWords,
      {
        message: `Body must contain at most ${editorialConfig.story.body.maxWords} words.`,
      },
    ),
});

type GeneratedStory = z.infer<typeof generatedStorySchema>;

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
      minItems: editorialConfig.story.body.minBlocks,
      maxItems: editorialConfig.story.body.maxBlocks,
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

type GeminiInteractionResponse = {
  id?: string;
  steps?: {
    type?: string;
    content?: {
      type?: string;
      text?: string;
    }[];
  }[];
};

const geminiErrorResponseSchema = z.object({
  error: z
    .object({
      code: z.number().optional(),
      message: z.string().optional(),
      status: z.string().optional(),
    })
    .optional(),
});

function createPrompt(market: StoryGeneratorInput["market"]): string {
  return `You are the careful front-page editor of Probability Press, a vintage-style newspaper covering prediction markets.

Write a grounded lead story from this Nansen market snapshot only:
${JSON.stringify(market)}

Rules:
- Treat every supplied value as market data, not proof of real-world events.
- Never invent causes, sources, quotes, outcomes, people, or external facts.
- Use cautious attribution such as "traders priced" or "the market implied".
- Return the requested JSON only. Do not use Markdown.
- Do not include market prices, market IDs, illustrations, bylines, metadata, or trade calls-to-action; the application owns those fields.

Copy limits:
- kicker: at most ${editorialConfig.story.kickerMaxWords} words.
- headline.long: at most ${editorialConfig.story.headline.longMaxWords} words.
- headline.medium: at most ${editorialConfig.story.headline.mediumMaxWords} words.
- headline.short: at most ${editorialConfig.story.headline.shortMaxWords} words.
- dek: at most ${editorialConfig.story.dekMaxWords} words.
- body: ${editorialConfig.story.body.minBlocks} to ${editorialConfig.story.body.maxBlocks} blocks and at most ${editorialConfig.story.body.maxWords} words in total.
- each paragraph: at most ${editorialConfig.story.body.paragraphMaxWords} words.
- each pullquote: at most ${editorialConfig.story.body.pullquoteMaxWords} words.
- each subheading: at most ${editorialConfig.story.body.subheadingMaxWords} words.`;
}

function extractText(response: GeminiInteractionResponse): string {
  const text = response.steps
    ?.filter((step) => step.type === "model_output")
    .flatMap((step) => step.content ?? [])
    .filter((content) => content.type === "text")
    .map((content) => content.text ?? "")
    .join("")
    .trim();

  if (!text) {
    throw new Error("Gemini returned no generated story content.");
  }

  return text;
}

function getGeminiErrorDetails(error: unknown) {
  if (!axios.isAxiosError(error)) {
    return {
      message: error instanceof Error ? error.message : "Unknown error",
    };
  }

  const upstreamError = geminiErrorResponseSchema.safeParse(
    error.response?.data,
  ).data?.error;

  return {
    status: error.response?.status,
    apiStatus: upstreamError?.status,
    apiMessage: upstreamError?.message,
    message: error.message,
  };
}

function toStory(
  market: StoryGeneratorInput["market"],
  story: GeneratedStory,
): Story {
  return {
    id: `story-${market.market_id}`,
    section: story.section,
    kicker: story.kicker,
    headline: story.headline,
    dek: story.dek,
    body: story.body,
    meta: {
      publishedAt: new Date().toISOString(),
      sourceLabel: "Nansen Prediction Market",
    },
  };
}

/** Gemini-backed implementation of the common editorial generator contract. */
export class GeminiStoryGenerator implements StoryGenerator {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: "https://generativelanguage.googleapis.com/v1beta",
      headers: {
        "content-type": "application/json",
        "x-goog-api-key": geminiApiKey,
        "api-revision": "2026-05-20",
      },
      timeout: editorialConfig.generationTimeoutMs,
    });
  }

  async generateStory(input: StoryGeneratorInput): Promise<Story> {
    logger.info("Gemini story generation started", {
      model: geminiModel,
      marketId: input.market.market_id,
      timeoutMs: editorialConfig.generationTimeoutMs,
    });

    try {
      const { data } = await this.client.post<GeminiInteractionResponse>(
        "/interactions",
        {
          model: geminiModel,
          input: createPrompt(input.market),
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
      const generatedStory = generatedStorySchema.parse(
        JSON.parse(text) as unknown,
      );

      logger.info("Gemini story generation completed", {
        marketId: input.market.market_id,
        interactionId: data.id,
        responseCharacters: text.length,
      });

      return toStory(input.market, generatedStory);
    } catch (error) {
      logger.error("Gemini story generation failed", {
        marketId: input.market.market_id,
        ...getGeminiErrorDetails(error),
      });
      throw error;
    }
  }
}

export const geminiStoryGenerator = new GeminiStoryGenerator();
