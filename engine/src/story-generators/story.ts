import { z } from "zod";

import type { EditorialEngineConfig } from "../config";
import { storyCategorySchema } from "../schema/front-page";
import type { PolymarketMarket, StorySource } from "../types";

/** Validates generated-story structure without imposing editorial length limits. */
export function createGeneratedStorySchema() {
  return z.object({
    category: storyCategorySchema,
    kicker: z.string(),
    headline: z.object({
      long: z.string(),
      medium: z.string(),
      short: z.string(),
    }),
    dek: z.string(),
    body: z.array(
      z.discriminatedUnion("type", [
        z.object({ type: z.literal("paragraph"), text: z.string() }),
        z.object({ type: z.literal("pullquote"), text: z.string() }),
        z.object({ type: z.literal("subheading"), text: z.string() }),
      ]),
    ),
  });
}

export function createStoryPrompt(
  market: PolymarketMarket,
  sources: readonly StorySource[],
  config: EditorialEngineConfig,
): string {
  const marketContext = {
    question: market.question,
    eventTitle: market.event_title,
  };
  const promptWithoutSources = createPrompt(marketContext, [], config);
  if (promptWithoutSources.length >= config.story.maxInputCharacters) {
    throw new Error(
      "Story input budget is too small for the editorial prompt.",
    );
  }

  return createPrompt(
    marketContext,
    packSources(marketContext, sources, config),
    config,
  );
}

type PromptSource = {
  title: string | null;
  description: string | null;
  text: string;
};

function createPrompt(
  market: {
    question: string | null | undefined;
    eventTitle: string | null | undefined;
  },
  sources: PromptSource[],
  config: EditorialEngineConfig,
): string {
  return `You are writing one factual news story for Forecaster Times from supplied material only.

MARKET
Event: ${market.eventTitle ?? "Not provided"}
Question: ${market.question ?? "Not provided"}

SOURCES
${sources.map(formatSource).join("\n\n")}

TASK
Write a concise newspaper report focused only on developments materially relevant to the market question.

Rules:
- Treat supplied sources as the primary material. If they contain no substantive news text (for example, navigation, a streaming landing page, or boilerplate) and reporting requires it, you may independently search for recent, credible news.
- Do not invent facts, infer causes, or treat market odds as proof.
- Prefer recent concrete developments over background.
- Merge duplicate facts across sources.
- If sources conflict, preserve the disagreement.
- Avoid repeating the same fact in dek and body.
- Neutral newspaper tone; no opinion or hype.

Limits:
- kicker: ${config.story.kickerMaxWords} words
- headline long/medium/short: ${config.story.headline.longMaxWords}/${config.story.headline.mediumMaxWords}/${config.story.headline.shortMaxWords} words
- dek: ${config.story.dekMaxWords} words
- body: ${config.story.body.minBlocks}-${config.story.body.maxBlocks} paragraphs, ${config.story.body.maxWords} words total

Return JSON only:
{
  "category": "world|politics|money|technology|crypto|sports|culture|oddities",
  "kicker": "...",
  "headline": {
    "long": "...",
    "medium": "...",
    "short": "..."
  },
  "dek": "...",
  "body": [
    {"type": "paragraph", "text": "..."}
  ]
}`;
}

function formatSource(source: PromptSource, index: number): string {
  return `SOURCE ${index + 1}
Title: ${source.title ?? "Not provided"}
Summary: ${source.description ?? "Not provided"}
Text: ${source.text}`;
}

function packSources(
  market: {
    question: string | null | undefined;
    eventTitle: string | null | undefined;
  },
  sources: readonly StorySource[],
  config: EditorialEngineConfig,
): PromptSource[] {
  const packed: PromptSource[] = [];

  for (const source of sources) {
    const candidate: PromptSource = {
      title: source.title,
      description: source.description,
      text: source.text,
    };
    if (
      createPrompt(market, [...packed, candidate], config).length <=
      config.story.maxInputCharacters
    ) {
      packed.push(candidate);
      continue;
    }

    if (packed.length === 0) {
      const truncated = truncateSourceToFit(market, candidate, config);
      if (truncated) {
        packed.push(truncated);
      }
    }

    break;
  }

  return packed;
}

function truncateSourceToFit(
  market: {
    question: string | null | undefined;
    eventTitle: string | null | undefined;
  },
  source: PromptSource,
  config: EditorialEngineConfig,
): PromptSource | undefined {
  let lowerBound = 0;
  let upperBound = source.text.length;
  let result: PromptSource | undefined;

  while (lowerBound <= upperBound) {
    const midpoint = Math.floor((lowerBound + upperBound) / 2);
    const candidate = { ...source, text: source.text.slice(0, midpoint) };

    if (
      createPrompt(market, [candidate], config).length <=
      config.story.maxInputCharacters
    ) {
      result = candidate;
      lowerBound = midpoint + 1;
    } else {
      upperBound = midpoint - 1;
    }
  }

  return result;
}
