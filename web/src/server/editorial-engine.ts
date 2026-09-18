import { createEditorialEngine, createEditorialLogger } from "@repo/engine";

import {
  geminiApiKey,
  nansenApiBaseUrl,
  nansenApiKey,
  nodeEnv,
  s3AccessKeyId,
  s3BucketName,
  s3Endpoint,
  s3Region,
  s3SecretAccessKey,
} from "@/config/env";
export const logger = createEditorialLogger(
  nodeEnv === "development" ? "debug" : "info",
);

/** Web's server boundary for the editorial engine and its infrastructure config. */
export const editorialEngine = createEditorialEngine({
  nansen: { apiKey: nansenApiKey, baseUrl: nansenApiBaseUrl },
  s3: {
    endpoint: s3Endpoint,
    accessKeyId: s3AccessKeyId,
    secretAccessKey: s3SecretAccessKey,
    region: s3Region,
    bucketName: s3BucketName,
  },
  gemini: { apiKey: geminiApiKey, model: "gemini-3.8-flash" },
  logger,
});
