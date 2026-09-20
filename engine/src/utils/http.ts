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

  try {
    const serialized =
      typeof value === "string" ? value : JSON.stringify(value);
    return serialized?.slice(0, 2_000);
  } catch {
    return String(value).slice(0, 2_000);
  }
}

export function getLoggableServiceError(error: unknown): string | undefined {
  if (axios.isAxiosError(error)) {
    return toLoggableResponse(error.response?.data);
  }

  if (typeof error === "object" && error !== null && "error" in error) {
    return toLoggableResponse(error.error);
  }

  return undefined;
}
