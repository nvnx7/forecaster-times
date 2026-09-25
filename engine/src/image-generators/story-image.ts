import { imageGenerationConfig } from "../config";
import type { Story } from "../types";

export function createStoryImagePrompt(story: Story): string {
  const storyContext = [story.kicker, story.headline.long, story.dek]
    .filter(Boolean)
    .join(" ");

  return `${imageGenerationConfig.stylePrompt}

Create one visual scene inspired by this news brief. Use it only to determine
the subject, people, setting, and mood; never reproduce or depict any of its words:

${storyContext}

Absolutely no visible text or text-like marks.`;
}

export function createStoryImageAltText(story: Story): string {
  return `Newspaper illustration for ${story.headline.long}`;
}
