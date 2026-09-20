import { z } from "zod";

import type { EditorialEngineConfig } from "../config";
import { storyCategorySchema } from "../schema/front-page";
import type { PolymarketMarket, StorySource } from "../types";
import { wordCount } from "../utils";

function boundedText(maxWords: number) {
  return z
    .string()
    .trim()
    .min(1)
    .refine((value) => wordCount(value) <= maxWords);
}

export function createGeneratedStorySchema(config: EditorialEngineConfig) {
  return z.object({
    category: storyCategorySchema,
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

export function createStoryPrompt(
  market: PolymarketMarket,
  sources: readonly StorySource[],
  config: EditorialEngineConfig,
): string {
  const marketContext = {
    question: market.question,
    eventTitle: market.event_title,
    tags: market.tags,
    endDate: market.end_date,
  };
  const promptWithoutSources = createPrompt(marketContext, [], config);
  const sourceBudget =
    config.story.maxInputCharacters - promptWithoutSources.length;
  if (sourceBudget <= 0) {
    throw new Error(
      "Story input budget is too small for the editorial prompt.",
    );
  }

  return createPrompt(
    marketContext,
    packSources(sources, sourceBudget),
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
    tags: string[] | null | undefined;
    endDate: string | null | undefined;
  },
  sources: PromptSource[],
  config: EditorialEngineConfig,
): string {
  return `Write a Probability Press editorial from only this supplied context.
MARKET:${JSON.stringify(market)}
SOURCES:${JSON.stringify(sources)}
Rules: summarize sources; do not browse, invent facts, or treat market values as proof. Use cautious attribution for market context. Return JSON only—no Markdown, prices, IDs, byline, metadata, illustration, or trade prompt.
Limits: kicker ${config.story.kickerMaxWords} words; headlines ${config.story.headline.longMaxWords}/${config.story.headline.mediumMaxWords}/${config.story.headline.shortMaxWords} words; dek ${config.story.dekMaxWords} words; body ${config.story.body.minBlocks}-${config.story.body.maxBlocks} blocks, ${config.story.body.maxWords} words total.
JSON:{"category":"world","kicker":"...","headline":{"long":"...","medium":"...","short":"..."},"dek":"...","body":[{"type":"paragraph","text":"..."}]}`;
}

function packSources(
  sources: readonly StorySource[],
  characterBudget: number,
): PromptSource[] {
  const packed: PromptSource[] = [];

  for (const source of sources) {
    const candidate: PromptSource = {
      title: source.title,
      description: source.description,
      text: source.text,
    };
    if (JSON.stringify([...packed, candidate]).length <= characterBudget) {
      packed.push(candidate);
      continue;
    }

    if (packed.length === 0) {
      const truncated = truncateSourceToFit(candidate, characterBudget);
      if (truncated) {
        packed.push(truncated);
      }
    }

    break;
  }

  return packed;
}

function truncateSourceToFit(
  source: PromptSource,
  characterBudget: number,
): PromptSource | undefined {
  let lowerBound = 0;
  let upperBound = source.text.length;
  let result: PromptSource | undefined;

  while (lowerBound <= upperBound) {
    const midpoint = Math.floor((lowerBound + upperBound) / 2);
    const candidate = { ...source, text: source.text.slice(0, midpoint) };

    if (JSON.stringify([candidate]).length <= characterBudget) {
      result = candidate;
      lowerBound = midpoint + 1;
    } else {
      upperBound = midpoint - 1;
    }
  }

  return result;
}
