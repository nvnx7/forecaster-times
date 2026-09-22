import { type OpenRouterAIClient, OpenRouterAIError } from "../clients";
import { imagePresets } from "../config";
import { GenerationError, isSafetyBlockedError } from "../generation";
import { logger } from "../logger";
import type { GeneratedBy } from "../types";
import type {
  GeneratedStoryImage,
  StoryImageGenerationRequest,
  StoryImageGenerator,
} from "./interface";
import { createStoryImageAltText, createStoryImagePrompt } from "./story-image";

export type OpenRouterStoryImageGeneratorOptions = {
  client: OpenRouterAIClient;
  imageOptions?: {
    outputFormat?: "png" | "jpeg" | "webp";
    quality?: "auto" | "low" | "medium" | "high";
    resolution?: "512" | "1K" | "2K" | "4K";
  };
};

/** Generates an illustration with one configured OpenRouter image model. */
export class OpenRouterStoryImageGenerator implements StoryImageGenerator {
  get generatedBy(): GeneratedBy {
    return { provider: "openrouter", model: this.options.client.modelName };
  }

  constructor(private readonly options: OpenRouterStoryImageGeneratorOptions) {}

  async generateStoryImage(
    request: StoryImageGenerationRequest,
  ): Promise<GeneratedStoryImage> {
    const preset = imagePresets[request.preset];
    logger.debug("OpenRouter story illustration generation started", {
      storyId: request.story.id,
      ...this.generatedBy,
      role: request.role,
      preset: request.preset,
    });

    try {
      const image = await this.options.client.generateImage({
        ...this.options.imageOptions,
        prompt: createStoryImagePrompt(request.story),
        aspectRatio: preset.aspectRatio,
      });
      return {
        bytes: image.bytes,
        contentType: image.contentType,
        alt: createStoryImageAltText(request.story),
        generatedBy: this.generatedBy,
      };
    } catch (error) {
      const status =
        error instanceof OpenRouterAIError ? error.status : undefined;
      const isUnavailableInRegion =
        status === 403 &&
        error instanceof OpenRouterAIError &&
        /model is not available in your region/i.test(
          error.responseBody ?? error.message,
        );
      const kind = isSafetyBlockedError(error)
        ? "safety_blocked"
        : status === 429
          ? "rate_limited"
          : isUnavailableInRegion || (status !== undefined && status >= 500)
            ? "unavailable"
            : status === undefined
              ? "invalid_output"
              : "invalid_request";
      throw new GenerationError(
        error instanceof Error
          ? error.message
          : "OpenRouter illustration generation failed.",
        {
          generatedBy: this.generatedBy,
          kind,
          fallbackEligible: kind !== "invalid_request",
        },
      );
    }
  }
}
