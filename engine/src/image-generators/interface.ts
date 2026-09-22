import type { GeneratedBy, ImagePresetKey, Story, StoryRole } from "../types";

export type StoryImageGenerationRequest = {
  story: Story;
  role: StoryRole;
  preset: ImagePresetKey;
};

export type GeneratedStoryImage = {
  bytes: Uint8Array;
  contentType: string;
  alt: string;
  generatedBy: GeneratedBy;
};

/** Contract implemented by provider-backed editorial illustration generators. */
export interface StoryImageGenerator {
  readonly generatedBy: GeneratedBy;

  generateStoryImage(
    request: StoryImageGenerationRequest,
  ): Promise<GeneratedStoryImage>;
}
