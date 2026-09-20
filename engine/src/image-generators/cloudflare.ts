import type { CloudflareWorkersAiClient, GeneratedImage } from "../clients";
import { IMAGE_PRESETS, imageGenerationConfig } from "../config";
import { logger } from "../logger";
import type { Story } from "../types";
import type {
  GeneratedStoryImage,
  StoryImageGenerationRequest,
  StoryImageGenerator,
} from "./interface";

function createStoryImagePrompt(story: Story): string {
  const editorialContext = [story.kicker, story.headline.long, story.dek]
    .filter(Boolean)
    .join(". ");

  return `${imageGenerationConfig.stylePrompt}\n\nEditorial subject: ${editorialContext}`;
}

function createAltText(story: Story): string {
  return `Newspaper illustration for ${story.headline.long}`;
}

export type CloudflareStoryImageGeneratorOptions = {
  client: CloudflareWorkersAiClient;
};

/** Generates vintage editorial illustrations with Cloudflare Workers AI. */
export class CloudflareStoryImageGenerator implements StoryImageGenerator {
  constructor(private readonly options: CloudflareStoryImageGeneratorOptions) {}

  async generateStoryImage(
    request: StoryImageGenerationRequest,
  ): Promise<GeneratedStoryImage> {
    const preset = IMAGE_PRESETS[request.preset];
    const dimensions =
      imageGenerationConfig.dimensionsByAspectRatio[preset.aspectRatio];

    logger.debug("Story illustration generation started", {
      storyId: request.story.id,
      role: request.role,
      preset: request.preset,
      aspectRatio: preset.aspectRatio,
    });

    const image: GeneratedImage =
      await this.options.client.generateFlux2Klein4bImage({
        prompt: createStoryImagePrompt(request.story),
        ...dimensions,
      });

    logger.debug("Story illustration generation completed", {
      storyId: request.story.id,
      role: request.role,
      preset: request.preset,
      contentType: image.contentType,
    });

    return {
      bytes: image.bytes,
      contentType: image.contentType,
      alt: createAltText(request.story),
    };
  }
}
