import Groq from "groq-sdk";
import { logger } from "../logger";

export const groqGptOss120bModel = "openai/gpt-oss-120b" as const;

export type GroqAIClientOptions = {
  apiKey: string;
  timeoutMs?: number;
};

export type GroqPromptOptions = {
  systemPrompt?: string;
  temperature?: number;
  maxCompletionTokens?: number;
  jsonMode?: boolean;
};

/** Text-generation client for Groq's OpenAI-compatible API. */
export class GroqAIClient {
  // private readonly client: OpenAI;
  private readonly client: Groq;

  constructor(options: GroqAIClientOptions) {
    // this.client = new OpenAI({
    //   apiKey: options.apiKey,
    //   baseURL: groqBaseUrl,
    //   timeout: options.timeoutMs ?? 120_000,
    // });
    this.client = new Groq({
      apiKey: options.apiKey,
    });
  }

  /**
   * Generates text with Groq's `openai/gpt-oss-20b` model.
   *
   * @example
   * const client = new GroqAIClient({ apiKey: "your-groq-api-key" });
   * const text = await client.prompt("Write a concise newspaper headline.");
   */
  async prompt(
    input: string,
    options: GroqPromptOptions = {},
  ): Promise<string> {
    if (!input.trim()) {
      throw new Error("A prompt is required to generate text.");
    }

    logger.debug("Groq text generation started", {
      model: groqGptOss120bModel,
      maxCompletionTokens: options.maxCompletionTokens,
    });

    try {
      // console.log("INPUT", input);
      const response = await this.client.chat.completions.create({
        model: groqGptOss120bModel,
        messages: [
          { role: "user", content: input },
          // ...(options.systemPrompt
          //   ? [{ role: "system" as const, content: options.systemPrompt }]
          //   : []),
        ],
        // response_format: { type: "json_object" },
        temperature: options.temperature,
        // max_completion_tokens: options.maxCompletionTokens,
        // response_format: options.jsonMode ? { type: "json_object" } : undefined,
      });
      // logger.info("RESPONSE", "\n", response);
      const text = response.choices[0]?.message.content;
      if (!text) {
        throw new Error("Groq returned a completion without text content.");
      }

      logger.debug("Groq text generation completed", {
        model: response.model,
        completionId: response.id,
        completionTokens: response.usage?.completion_tokens,
      });

      return text;
    } catch (error) {
      logger.error("Groq text generation failed:", error);
      // logger.error("Groq text generation failed", {
      //   model: groqGptOss20bModel,
      //   status: error instanceof OpenAI.APIError ? error.status : undefined,
      //   responseBody: getLoggableServiceError(error),
      //   message: error instanceof Error ? error.message : "Unknown error",
      // });
      throw error;
    }
  }
}
