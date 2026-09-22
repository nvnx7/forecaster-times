import { imageGenerationConfig } from "../config";
import type { Story } from "../types";

export function createStoryImagePrompt(story: Story): string {
  const editorialContext = [story.kicker, story.headline.long, story.dek]
    .filter(Boolean)
    .join(". ");

  return `${imageGenerationConfig.stylePrompt}\n\nEditorial subject: ${editorialContext}`;
}

export function createStoryImageAltText(story: Story): string {
  return `Newspaper illustration for ${story.headline.long}`;
}
