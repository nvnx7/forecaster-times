import OpenAI from "openai";

import { logger } from "../logger";

const groqBaseUrl = "https://api.groq.com/openai/v1";
export const groqGptOss20bModel = "openai/gpt-oss-20b" as const;

export type GroqAIClientOptions = {
  apiKey: string;
  timeoutMs?: number;
};

export type GroqPromptOptions = {
  systemPrompt?: string;
  temperature?: number;
  maxCompletionTokens?: number;
};

/** Text-generation client for Groq's OpenAI-compatible API. */
export class GroqAIClient {
  private readonly client: OpenAI;

  constructor(options: GroqAIClientOptions) {
    this.client = new OpenAI({
      apiKey: options.apiKey,
      baseURL: groqBaseUrl,
      timeout: options.timeoutMs ?? 120_000,
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
      model: groqGptOss20bModel,
      maxCompletionTokens: options.maxCompletionTokens,
    });

    try {
      const response = await this.client.chat.completions.create({
        model: groqGptOss20bModel,
        messages: [
          ...(options.systemPrompt
            ? [{ role: "system" as const, content: options.systemPrompt }]
            : []),
          { role: "user", content: input },
        ],
        temperature: options.temperature,
        max_completion_tokens: options.maxCompletionTokens,
      });
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
      logger.error("Groq text generation failed", {
        model: groqGptOss20bModel,
        status: error instanceof OpenAI.APIError ? error.status : undefined,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
