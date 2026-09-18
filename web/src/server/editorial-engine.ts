import {
  createEditorialEngine,
  defaultEditorialConfig,
  GeminiStoryGenerator,
  logger,
} from "@repo/engine";

import {
  geminiApiKey,
  nansenApiBaseUrl,
  nansenApiKey,
  s3AccessKeyId,
  s3BucketName,
  s3Endpoint,
  s3Region,
  s3SecretAccessKey,
  tinyFishApiKey,
} from "@/config/env";

export { logger };

const storyGenerator = new GeminiStoryGenerator({
  apiKey: geminiApiKey,
  model: "gemini-3.8-flash",
  config: defaultEditorialConfig,
});

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
  tinyFish: { apiKey: tinyFishApiKey },
  storyGenerator,
});
