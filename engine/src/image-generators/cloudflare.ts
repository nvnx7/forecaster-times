import {
  type CloudflareWorkersAiClient,
  CloudflareWorkersAiError,
  flux2Klein4bModel,
} from "../clients";
import { imageGenerationConfig, imagePresets } from "../config";
import { GenerationError, isSafetyBlockedError } from "../generation";
import { logger } from "../logger";
import type { GeneratedBy } from "../types";
import type {
  GeneratedStoryImage,
  StoryImageGenerationRequest,
  StoryImageGenerator,
} from "./interface";
import { createStoryImageAltText, createStoryImagePrompt } from "./story-image";

export type CloudflareStoryImageGeneratorOptions = {
  client: CloudflareWorkersAiClient;
};

/** Generates an illustration with one configured Cloudflare model. */
export class CloudflareStoryImageGenerator implements StoryImageGenerator {
  get generatedBy(): GeneratedBy {
    return { provider: "cloudflare", model: flux2Klein4bModel };
  }

  constructor(private readonly options: CloudflareStoryImageGeneratorOptions) {}

  async generateStoryImage(
    request: StoryImageGenerationRequest,
  ): Promise<GeneratedStoryImage> {
    const preset = imagePresets[request.preset];
    const dimensions =
      imageGenerationConfig.dimensionsByAspectRatio[preset.aspectRatio];
    const prompt = createStoryImagePrompt(request.story);

    logger.debug("Cloudflare story illustration generation started", {
      storyId: request.story.id,
      ...this.generatedBy,
      role: request.role,
      preset: request.preset,
      aspectRatio: preset.aspectRatio,
    });

    try {
      const image = await this.options.client.generateFlux2Klein4bImage({
        prompt,
        ...dimensions,
      });

      logger.debug("Cloudflare story illustration generation completed", {
        storyId: request.story.id,
        ...this.generatedBy,
        contentType: image.contentType,
      });

      return {
        bytes: image.bytes,
        contentType: image.contentType,
        alt: createStoryImageAltText(request.story),
        generatedBy: this.generatedBy,
      };
    } catch (error) {
      throw this.toGenerationError(error);
    }
  }

  private toGenerationError(error: unknown): GenerationError {
    const status =
      error instanceof CloudflareWorkersAiError ? error.status : undefined;
    const kind =
      (error instanceof CloudflareWorkersAiError && error.code === 3030) ||
      isSafetyBlockedError(error)
        ? "safety_blocked"
        : status === 429
          ? "rate_limited"
          : status !== undefined && status >= 500
            ? "unavailable"
            : status === undefined
              ? "invalid_output"
              : "invalid_request";

    return new GenerationError(
      error instanceof Error
        ? error.message
        : "Cloudflare illustration generation failed.",
      {
        generatedBy: this.generatedBy,
        kind,
        fallbackEligible: kind !== "invalid_request",
      },
    );
  }
}
