import axios from "axios";

export function isRetryableRequestError(error: unknown): boolean {
  if (!axios.isAxiosError(error)) return false;

  const status = error.response?.status;
  return (
    status === 408 || status === 429 || (status !== undefined && status >= 500)
  );
}

export function toLoggableResponse(value: unknown): string | undefined {
  if (value === undefined) return undefined;

  const serialized = typeof value === "string" ? value : JSON.stringify(value);
  return serialized?.slice(0, 2_000);
}
