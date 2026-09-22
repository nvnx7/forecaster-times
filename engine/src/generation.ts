import type { GeneratedBy } from "./types";

export type GenerationFailureKind =
  | "safety_blocked"
  | "rate_limited"
  | "unavailable"
  | "invalid_request"
  | "invalid_output";

/** A provider failure annotated with whether the next configured candidate may run. */
export class GenerationError extends Error {
  constructor(
    message: string,
    readonly details: {
      generatedBy: GeneratedBy;
      kind: GenerationFailureKind;
      fallbackEligible: boolean;
    },
  ) {
    super(message);
    this.name = "GenerationError";
  }
}

export function isSafetyBlockedError(error: unknown): boolean {
  const responseBody =
    typeof error === "object" &&
    error !== null &&
    "responseBody" in error &&
    typeof error.responseBody === "string"
      ? error.responseBody
      : "";
  const message = error instanceof Error ? error.message : "";
  return /flagged|safety|moderation|content policy|blocked/i.test(
    `${message} ${responseBody}`,
  );
}
