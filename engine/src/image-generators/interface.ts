import type { ImagePresetKey, Story, StoryRole } from "../types";

export type StoryImageGenerationRequest = {
  story: Story;
  role: StoryRole;
  preset: ImagePresetKey;
};

export type GeneratedStoryImage = {
  bytes: Uint8Array;
  contentType: string;
  alt: string;
};

/** Contract implemented by provider-backed editorial illustration generators. */
export interface StoryImageGenerator {
  generateStoryImage(
    request: StoryImageGenerationRequest,
  ): Promise<GeneratedStoryImage>;
}
