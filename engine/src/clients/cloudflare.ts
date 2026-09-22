import axios, { type AxiosInstance } from "axios";

import { logger } from "../logger";
import { toLoggableResponse } from "../utils";

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

export class CloudflareWorkersAiError extends Error {
  readonly status: number | undefined;
  readonly code: number | undefined;
  readonly responseBody: string | undefined;

  constructor(
    message: string,
    details: {
      status?: number;
      code?: number;
      responseBody?: string;
    },
  ) {
    super(message);
    this.name = "CloudflareWorkersAiError";
    this.status = details.status;
    this.code = details.code;
    this.responseBody = details.responseBody;
  }
}

type CloudflareImageResponse = {
  success?: boolean;
  errors?: unknown;
  result?: { image?: string };
};

function getCloudflareErrorCode(
  responseBody: string | undefined,
): number | undefined {
  if (!responseBody) return undefined;

  try {
    const payload = JSON.parse(responseBody) as {
      errors?: { code?: unknown }[];
    };
    const code = payload.errors?.[0]?.code;
    return typeof code === "number" ? code : undefined;
  } catch {
    return undefined;
  }
}

function decodeBase64Image(image: string): GeneratedImage {
  const dataUriMatch = image.match(
    /^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/,
  );
  const binary = atob(dataUriMatch?.[2] ?? image);
  return {
    bytes: Uint8Array.from(binary, (character) => character.charCodeAt(0)),
    contentType: dataUriMatch?.[1] ?? "image/png",
  };
}

/** Client for FLUX.2 [klein] 4B image generation through Cloudflare Workers AI. */
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
      const bytes = new Uint8Array(response.data);
      const responseContentType = response.headers["content-type"];
      const contentType =
        typeof responseContentType === "string"
          ? responseContentType
          : undefined;

      if (contentType?.toLowerCase().includes("application/json")) {
        const responseText = new TextDecoder().decode(bytes);
        let payload: CloudflareImageResponse;
        try {
          payload = JSON.parse(responseText) as CloudflareImageResponse;
        } catch {
          throw new Error(
            `Cloudflare Workers AI returned invalid JSON: ${toLoggableResponse(responseText)}`,
          );
        }

        const encodedImage = payload.result?.image;
        if (!payload.success || !encodedImage) {
          throw new CloudflareWorkersAiError(
            "Cloudflare Workers AI returned an unsuccessful image response.",
            {
              code: getCloudflareErrorCode(responseText),
              responseBody: responseText,
            },
          );
        }

        const image = decodeBase64Image(encodedImage);
        logger.debug("Cloudflare Workers AI image generation completed", {
          model: flux2Klein4bModel,
          contentType: image.contentType,
          byteLength: image.bytes.byteLength,
          responseFormat: "json-base64",
        });
        return image;
      }

      const image = { bytes, contentType: contentType ?? "image/png" };
      logger.debug("Cloudflare Workers AI image generation completed", {
        model: flux2Klein4bModel,
        contentType: image.contentType,
        byteLength: bytes.byteLength,
        responseFormat: "binary",
      });
      return image;
    } catch (error) {
      const status = axios.isAxiosError(error)
        ? error.response?.status
        : error instanceof CloudflareWorkersAiError
          ? error.status
          : undefined;
      const responseBody = axios.isAxiosError(error)
        ? toLoggableResponse(error.response?.data)
        : error instanceof CloudflareWorkersAiError
          ? error.responseBody
          : undefined;
      const code =
        error instanceof CloudflareWorkersAiError
          ? error.code
          : getCloudflareErrorCode(responseBody);

      logger.error("Cloudflare Workers AI image generation failed", {
        model: flux2Klein4bModel,
        status,
        code,
        responseBody,
        message: error instanceof Error ? error.message : "Unknown error",
      });

      if (axios.isAxiosError(error)) {
        throw new CloudflareWorkersAiError(error.message, {
          status,
          code,
          responseBody,
        });
      }

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
    if (value !== undefined) form.append(name, String(value));
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
