import { OpenRouter } from "@openrouter/sdk";
import axios, { type AxiosInstance } from "axios";

import { logger } from "../logger";
import type { ImageAspectRatio } from "../types";
import { getLoggableServiceError } from "../utils";

export type OpenRouterAIClientOptions = {
  apiKey: string;
  model: string;
  siteUrl?: string;
  appName?: string;
  timeoutMs?: number;
};

export type OpenRouterPromptOptions = {
  systemPrompt?: string;
  temperature?: number;
  maxCompletionTokens?: number;
  jsonMode?: boolean;
  reasoningEffort?: "minimal" | "low" | "medium" | "high";
};

export type OpenRouterImageOptions = {
  prompt: string;
  aspectRatio: OpenRouterImageAspectRatio;
  outputFormat?: "png" | "jpeg" | "webp";
  quality?: "auto" | "low" | "medium" | "high";
  resolution?: "512" | "1K" | "2K" | "4K";
  n?: number;
};

export type OpenRouterImageAspectRatio =
  | ImageAspectRatio
  | "4:3"
  | "3:4"
  | "16:9"
  | "9:16"
  | "auto";

export type OpenRouterGeneratedImage = {
  bytes: Uint8Array;
  contentType: string;
};

export class OpenRouterAIError extends Error {
  constructor(
    message: string,
    readonly status: number | undefined,
    readonly responseBody: string | undefined,
  ) {
    super(message);
    this.name = "OpenRouterAIError";
  }
}

type OpenRouterImageResponse = {
  data?: { b64_json?: string; url?: string }[];
};

function getErrorStatus(error: unknown): number | undefined {
  if (axios.isAxiosError(error)) return error.response?.status;
  if (typeof error !== "object" || error === null) return undefined;
  const status = "status" in error ? error.status : undefined;
  return typeof status === "number" ? status : undefined;
}

function getImageContentType(outputFormat: "png" | "jpeg" | "webp"): string {
  return `image/${outputFormat}`;
}

function decodeBase64Image(
  image: string,
  defaultContentType: string,
): OpenRouterGeneratedImage {
  const dataUriMatch = image.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );
  const binary = atob(dataUriMatch?.[2] ?? image);
  return {
    bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    contentType: dataUriMatch?.[1] ?? defaultContentType,
  };
}

/** Text and image generation client for OpenRouter. */
export class OpenRouterAIClient {
  private readonly client: OpenRouter;
  private readonly imageClient: AxiosInstance;
  private readonly model: string;

  constructor(options: OpenRouterAIClientOptions) {
    if (!options.apiKey.trim()) {
      throw new Error("An OpenRouter API key is required.");
    }

    if (!options.model.trim()) {
      throw new Error("An OpenRouter model name is required.");
    }

    this.model = options.model;
    this.client = new OpenRouter({
      apiKey: options.apiKey,
      httpReferer: options.siteUrl,
      appTitle: options.appName,
      timeoutMs: options.timeoutMs ?? 120_000,
    });
    this.imageClient = axios.create({
      baseURL: "https://openrouter.ai/api/v1",
      headers: {
        Authorization: `Bearer ${options.apiKey}`,
        ...(options.siteUrl ? { "HTTP-Referer": options.siteUrl } : {}),
        ...(options.appName ? { "X-Title": options.appName } : {}),
      },
      timeout: options.timeoutMs ?? 120_000,
    });
  }

  get modelName(): string {
    return this.model;
  }

  async prompt(
    input: string,
    options: OpenRouterPromptOptions = {},
  ): Promise<string> {
    if (!input.trim()) {
      throw new Error("A prompt is required to generate text.");
    }

    logger.debug("OpenRouter text generation started", {
      model: this.model,
      maxCompletionTokens: options.maxCompletionTokens,
    });

    try {
      const completion = await this.client.chat.send({
        chatRequest: {
          model: this.model,
          messages: [
            ...(options.systemPrompt
              ? [{ role: "system" as const, content: options.systemPrompt }]
              : []),
            { role: "user", content: input },
          ],
          stream: false,
          temperature: options.temperature,
          maxCompletionTokens: options.maxCompletionTokens,
          reasoning: options.reasoningEffort
            ? { effort: options.reasoningEffort }
            : undefined,
          responseFormat: options.jsonMode
            ? { type: "json_object" }
            : undefined,
        },
      });
      if (completion instanceof ReadableStream) {
        throw new Error(
          "OpenRouter unexpectedly returned a streaming response.",
        );
      }

      const content = completion.choices[0]?.message.content;
      const text = typeof content === "string" ? content : undefined;
      if (!text) {
        throw new Error(
          "OpenRouter returned a completion without text content.",
        );
      }

      logger.debug("OpenRouter text generation completed", {
        model: completion.model,
        completionId: completion.id,
        completionTokens: completion.usage?.completionTokens,
      });
      return text;
    } catch (error) {
      logger.error("OpenRouter text generation failed", {
        model: this.model,
        responseBody: getLoggableServiceError(error),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw this.toClientError(error);
    }
  }

  async generateImage(
    options: OpenRouterImageOptions,
  ): Promise<OpenRouterGeneratedImage> {
    if (!options.prompt.trim()) {
      throw new Error("A prompt is required to generate an image.");
    }
    if (
      options.n !== undefined &&
      (!Number.isInteger(options.n) || options.n < 1 || options.n > 6)
    ) {
      throw new Error(
        "The number of requested images must be between 1 and 6.",
      );
    }

    const outputFormat = options.outputFormat ?? "png";
    logger.debug("OpenRouter image generation started", {
      model: this.model,
      aspectRatio: options.aspectRatio,
      n: options.n,
      outputFormat,
    });

    try {
      const { data } = await this.imageClient.post<OpenRouterImageResponse>(
        "/images",
        {
          model: this.model,
          prompt: options.prompt,
          aspect_ratio: options.aspectRatio,
          ...(options.outputFormat
            ? { output_format: options.outputFormat }
            : {}),
          ...(options.quality ? { quality: options.quality } : {}),
          ...(options.resolution ? { resolution: options.resolution } : {}),
          ...(options.n ? { n: options.n } : {}),
          provider: { allow_fallbacks: false },
        },
      );
      const image = data.data?.[0];
      if (image?.b64_json) {
        const generated = decodeBase64Image(
          image.b64_json,
          getImageContentType(outputFormat),
        );
        logger.debug("OpenRouter image generation completed", {
          model: this.model,
          contentType: generated.contentType,
          byteLength: generated.bytes.byteLength,
          responseFormat: "base64",
        });
        return generated;
      }

      if (image?.url) {
        const response = await axios.get<ArrayBuffer>(image.url, {
          responseType: "arraybuffer",
          timeout: this.imageClient.defaults.timeout,
        });
        const header = response.headers["content-type"];
        const generated = {
          bytes: new Uint8Array(response.data),
          contentType:
            typeof header === "string"
              ? header
              : getImageContentType(outputFormat),
        };
        logger.debug("OpenRouter image generation completed", {
          model: this.model,
          contentType: generated.contentType,
          byteLength: generated.bytes.byteLength,
          responseFormat: "url",
        });
        return generated;
      }

      throw new Error(
        "OpenRouter returned an image response without an image.",
      );
    } catch (error) {
      logger.error("OpenRouter image generation failed", {
        model: this.model,
        status: getErrorStatus(error),
        responseBody: getLoggableServiceError(error),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw this.toClientError(error);
    }
  }

  private toClientError(error: unknown): OpenRouterAIError {
    if (error instanceof OpenRouterAIError) return error;

    return new OpenRouterAIError(
      error instanceof Error ? error.message : "Unknown OpenRouter error",
      getErrorStatus(error),
      getLoggableServiceError(error),
    );
  }
}
