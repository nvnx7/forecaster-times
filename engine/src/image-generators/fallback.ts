import { GenerationError } from "../generation";
import { logger } from "../logger";
import type { GeneratedBy } from "../types";
import type {
  GeneratedStoryImage,
  StoryImageGenerationRequest,
  StoryImageGenerator,
} from "./interface";

export type FallbackStoryImageGeneratorOptions = {
  generators: readonly StoryImageGenerator[];
};

/** Tries configured illustration generators in order until one creates an image. */
export class FallbackStoryImageGenerator implements StoryImageGenerator {
  readonly generatedBy: GeneratedBy = {
    provider: "fallback-router",
    model: "ordered",
  };

  constructor(private readonly options: FallbackStoryImageGeneratorOptions) {
    if (options.generators.length === 0) {
      throw new Error(
        "FallbackStoryImageGenerator requires at least one generator.",
      );
    }
  }

  async generateStoryImage(
    request: StoryImageGenerationRequest,
  ): Promise<GeneratedStoryImage> {
    for (const [index, generator] of this.options.generators.entries()) {
      try {
        return await generator.generateStoryImage(request);
      } catch (error) {
        const failure = error instanceof GenerationError ? error : undefined;
        logger.warn("Illustration generation candidate failed", {
          storyId: request.story.id,
          provider: generator.generatedBy.provider,
          model: generator.generatedBy.model,
          kind: failure?.details.kind ?? "unknown",
          message: error instanceof Error ? error.message : "Unknown error",
        });

        if (!failure?.details.fallbackEligible) throw error;
        if (!this.options.generators[index + 1]) throw error;

        logger.info("Illustration generation fallback attempted", {
          storyId: request.story.id,
          from: generator.generatedBy,
          to: this.options.generators[index + 1]?.generatedBy,
        });
      }
    }

    throw new Error("All illustration generation candidates failed.");
  }
}
