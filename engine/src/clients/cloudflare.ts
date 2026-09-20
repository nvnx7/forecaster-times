import axios, { type AxiosInstance } from "axios";

import { logger } from "../logger";
import { getLoggableServiceError } from "../utils";

const workersAiBaseUrl = "https://api.cloudflare.com/client/v4";
export const flux2Klein4bModel =
  "@cf/black-forest-labs/flux-2-klein-4b" as const;

export type CloudflareWorkersAiClientOptions = {
  accountId: string;
  apiToken: string;
  baseUrl?: string;
  timeoutMs?: number;
};

export type GenerateFlux2Klein4bImageParams = {
  prompt: string;
  width?: number;
  height?: number;
  guidance?: number;
  seed?: number;
  referenceImages?: Blob[];
};

export type GeneratedImage = {
  bytes: Uint8Array;
  contentType: string;
};

/** Client for image generation through Cloudflare Workers AI. */
export class CloudflareWorkersAiClient {
  private readonly accountId: string;
  private readonly client: AxiosInstance;

  constructor(options: CloudflareWorkersAiClientOptions) {
    this.accountId = options.accountId;
    this.client = axios.create({
      baseURL: options.baseUrl ?? workersAiBaseUrl,
      headers: { Authorization: `Bearer ${options.apiToken}` },
      timeout: options.timeoutMs ?? 120_000,
    });
  }

  /**
   * Generates an image with FLUX.2 [klein] 4B.
   *
   * Workers AI requires multipart form data for this model, including
   * prompt-only requests. The model supports up to four reference images.
   *
   * @example
   * const client = new CloudflareWorkersAiClient({
   *   accountId: "your-account-id",
   *   apiToken: "your-api-token",
   * });
   * const image = await client.generateFlux2Klein4bImage({
   *   prompt: "A monochrome nineteenth-century newspaper engraving of a city",
   *   width: 1024,
   *   height: 768,
   * });
   * await Bun.write("illustration.png", image.bytes);
   */
  async generateFlux2Klein4bImage(
    params: GenerateFlux2Klein4bImageParams,
  ): Promise<GeneratedImage> {
    this.validateImageParams(params);
    const form = this.createFlux2Klein4bForm(params);

    logger.debug("Cloudflare Workers AI image generation started", {
      model: flux2Klein4bModel,
      width: params.width,
      height: params.height,
      referenceImageCount: params.referenceImages?.length ?? 0,
    });

    try {
      const response = await this.client.post<ArrayBuffer>(
        `/accounts/${this.accountId}/ai/run/${flux2Klein4bModel}`,
        form,
        { responseType: "arraybuffer" },
      );
      const responseContentType = response.headers["content-type"];
      const contentType =
        typeof responseContentType === "string"
          ? responseContentType
          : "image/png";
      const bytes = new Uint8Array(response.data);

      logger.debug("Cloudflare Workers AI image generation completed", {
        model: flux2Klein4bModel,
        contentType,
        byteLength: bytes.byteLength,
      });

      return { bytes, contentType };
    } catch (error) {
      logger.error("Cloudflare Workers AI image generation failed", {
        model: flux2Klein4bModel,
        status: axios.isAxiosError(error) ? error.response?.status : undefined,
        responseBody: getLoggableServiceError(error),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private createFlux2Klein4bForm(
    params: GenerateFlux2Klein4bImageParams,
  ): FormData {
    const form = new FormData();
    form.append("prompt", params.prompt);

    this.appendNumber(form, "width", params.width);
    this.appendNumber(form, "height", params.height);
    this.appendNumber(form, "guidance", params.guidance);
    this.appendNumber(form, "seed", params.seed);
    params.referenceImages?.forEach((image, index) => {
      form.append(`input_image_${index}`, image);
    });

    return form;
  }

  private appendNumber(
    form: FormData,
    name: string,
    value: number | undefined,
  ) {
    if (value !== undefined) {
      form.append(name, String(value));
    }
  }

  private validateImageParams(params: GenerateFlux2Klein4bImageParams): void {
    if (!params.prompt.trim()) {
      throw new Error("A prompt is required to generate an image.");
    }

    if ((params.referenceImages?.length ?? 0) > 4) {
      throw new Error(
        "FLUX.2 [klein] 4B supports at most four reference images.",
      );
    }

    for (const dimension of [params.width, params.height]) {
      if (dimension !== undefined && (dimension < 256 || dimension > 1920)) {
        throw new Error("Image width and height must be between 256 and 1920.");
      }
    }
  }
}
