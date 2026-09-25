import {
  createEditorialEngine,
  defaultEditorialConfig,
  FallbackStoryGenerator,
  logger,
  OpenRouterAIClient,
  OpenRouterStoryGenerator,
  OpenRouterStoryImageGenerator,
  openRouterImageGenerationModels,
  openRouterStoryGenerationCandidates,
} from "@repo/engine";

import {
  nansenApiBaseUrl,
  nansenApiKey,
  openRouterApiKey,
  s3AccessKeyId,
  s3BucketName,
  s3Endpoint,
  s3Region,
  s3SecretAccessKey,
  tinyFishApiKey,
} from "@/config/env";

export { logger };

const storyGenerator = new FallbackStoryGenerator({
  generators: openRouterStoryGenerationCandidates.map(
    ({ model, reasoningEffort }) =>
      new OpenRouterStoryGenerator({
        client: new OpenRouterAIClient({
          apiKey: openRouterApiKey,
          model,
          appName: "Forecaster Times",
        }),
        config: defaultEditorialConfig,
        reasoningEffort,
      }),
  ),
});

const storyImageGenerator = new OpenRouterStoryImageGenerator({
  apiKey: openRouterApiKey,
  models: openRouterImageGenerationModels,
  appName: "Forecaster Times",
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
  storyImageGenerator,
});
