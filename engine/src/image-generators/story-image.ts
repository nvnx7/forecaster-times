import { imageGenerationConfig } from "../config";
import type { Story } from "../types";

export function createStoryImagePrompt(story: Story): string {
  const storyContext = [
    story.kicker && `Kicker: ${story.kicker}`,
    `Headline: ${story.headline.long}`,
    story.dek && `Dek: ${story.dek}`,
    `Story: ${story.body.map(({ text }) => text).join(" ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  return `${imageGenerationConfig.stylePrompt}

Scene:
${storyContext}

Absolutely no text, letters, numbers, captions, signs, labels, logos,
watermarks, charts, newspaper pages, UI, or typography.`;
}

export function createStoryImageAltText(story: Story): string {
  return `Newspaper illustration for ${story.headline.long}`;
}
