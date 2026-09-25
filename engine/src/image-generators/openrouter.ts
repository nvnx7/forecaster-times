import {
  OpenRouterAIClient,
  OpenRouterAIError,
  type OpenRouterImageAspectRatio,
} from "../clients";
import { imagePresets } from "../config";
import { GenerationError, isSafetyBlockedError } from "../generation";
import { logger } from "../logger";
import type { GeneratedBy, ImageAspectRatio } from "../types";
import type {
  GeneratedStoryImage,
  StoryImageGenerationRequest,
  StoryImageGenerator,
} from "./interface";
import { createStoryImageAltText, createStoryImagePrompt } from "./story-image";

export type OpenRouterStoryImageGeneratorOptions = {
  apiKey: string;
  models: readonly string[];
  appName?: string;
};

const recraftModel = "recraft/recraft-v4.1-flash";
const blackForestModel = "black-forest-labs/flux.2-klein-4b";
const kreaModel = "krea/krea-2-medium-turbo";
const recraftAspectRatios: Record<
  ImageAspectRatio,
  OpenRouterImageAspectRatio
> = { "3:2": "4:3", "4:5": "3:4", "1:1": "1:1" };
const blackForestAspectRatios: Record<
  ImageAspectRatio,
  OpenRouterImageAspectRatio
> = { "3:2": "3:2", "4:5": "3:4", "1:1": "1:1" };

function getImageOptions(model: string, aspectRatio: ImageAspectRatio) {
  if (model === recraftModel) {
    return { aspectRatio: recraftAspectRatios[aspectRatio], n: 1 };
  }

  if (model === blackForestModel) {
    return {
      aspectRatio: blackForestAspectRatios[aspectRatio],
      outputFormat: "png" as const,
      n: 1,
    };
  }

  if (model === kreaModel) {
    return { aspectRatio, resolution: "1K" as const };
  }

  throw new Error(`Unsupported OpenRouter image model: ${model}`);
}

/** Generates an illustration with ordered OpenRouter image-model fallbacks. */
export class OpenRouterStoryImageGenerator implements StoryImageGenerator {
  private readonly clients: OpenRouterAIClient[];

  get generatedBy(): GeneratedBy {
    return { provider: "openrouter", model: "ordered" };
  }

  constructor(options: OpenRouterStoryImageGeneratorOptions) {
    if (options.models.length === 0) {
      throw new Error(
        "OpenRouterStoryImageGenerator requires at least one model.",
      );
    }
    this.clients = options.models.map(
      (model) =>
        new OpenRouterAIClient({
          apiKey: options.apiKey,
          model,
          appName: options.appName,
        }),
    );
  }

  async generateStoryImage(
    request: StoryImageGenerationRequest,
  ): Promise<GeneratedStoryImage> {
    const preset = imagePresets[request.preset];
    const prompt = createStoryImagePrompt(request.story);
    logger.debug("OpenRouter story illustration generation started", {
      storyId: request.story.id,
      role: request.role,
      preset: request.preset,
    });

    for (const [index, client] of this.clients.entries()) {
      const generatedBy = { provider: "openrouter", model: client.modelName };
      try {
        const image = await client.generateImage({
          prompt,
          ...getImageOptions(client.modelName, preset.aspectRatio),
        });
        return {
          bytes: image.bytes,
          contentType: image.contentType,
          alt: createStoryImageAltText(request.story),
          generatedBy,
        };
      } catch (error) {
        const failure = this.toGenerationError(error, generatedBy);
        logger.warn("OpenRouter illustration generation candidate failed", {
          storyId: request.story.id,
          ...generatedBy,
          kind: failure.details.kind,
          message: failure.message,
        });
        const next = this.clients[index + 1];
        if (!failure.details.fallbackEligible || !next) {
          throw failure;
        }

        logger.info("OpenRouter illustration fallback attempted", {
          storyId: request.story.id,
          from: generatedBy,
          to: { provider: "openrouter", model: next.modelName },
        });
      }
    }

    throw new Error("All OpenRouter illustration models failed.");
  }

  private toGenerationError(
    error: unknown,
    generatedBy: GeneratedBy,
  ): GenerationError {
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
    return new GenerationError(
      error instanceof Error
        ? error.message
        : "OpenRouter illustration generation failed.",
      {
        generatedBy,
        kind,
        fallbackEligible: kind !== "invalid_request",
      },
    );
  }
}
