import {
  createEditorialEngine,
  defaultEditorialConfig,
  FallbackStoryGenerator,
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
} from "./config";

/** Creates the same fully configured engine used by every local editorial job. */
export function createScriptEditorialEngine() {
  const storyGenerators = openRouterStoryGenerationCandidates.map(
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
  );
  return createEditorialEngine({
    nansen: { apiKey: nansenApiKey, baseUrl: nansenApiBaseUrl },
    s3: {
      endpoint: s3Endpoint,
      accessKeyId: s3AccessKeyId,
      secretAccessKey: s3SecretAccessKey,
      region: s3Region,
      bucketName: s3BucketName,
    },
    tinyFish: { apiKey: tinyFishApiKey },
    storyGenerator: new FallbackStoryGenerator({
      generators: storyGenerators,
    }),
    storyImageGenerator: new OpenRouterStoryImageGenerator({
      apiKey: openRouterApiKey,
      models: openRouterImageGenerationModels,
      appName: "Forecaster Times",
    }),
  });
}
