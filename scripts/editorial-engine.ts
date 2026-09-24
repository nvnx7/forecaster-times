import {
  CloudflareStoryImageGenerator,
  CloudflareWorkersAiClient,
  createEditorialEngine,
  defaultEditorialConfig,
  FallbackStoryGenerator,
  FallbackStoryImageGenerator,
  OpenRouterAIClient,
  OpenRouterStoryGenerator,
  OpenRouterStoryImageGenerator,
  openRouterImageGenerationCandidates,
  openRouterStoryGenerationCandidates,
  type StoryImageGenerator,
} from "@repo/engine";

import {
  cloudflareAccountId,
  cloudflareApiKey,
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
  const cloudflareClient = new CloudflareWorkersAiClient({
    accountId: cloudflareAccountId,
    apiToken: cloudflareApiKey,
  });
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
  const imageGenerators: StoryImageGenerator[] = [
    new CloudflareStoryImageGenerator({
      client: cloudflareClient,
    }),
    ...openRouterImageGenerationCandidates.map(
      ({ model, ...imageOptions }) =>
        new OpenRouterStoryImageGenerator({
          client: new OpenRouterAIClient({
            apiKey: openRouterApiKey,
            model,
            appName: "Forecaster Times",
          }),
          imageOptions,
        }),
    ),
  ];

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
    storyImageGenerator: new FallbackStoryImageGenerator({
      generators: imageGenerators,
    }),
  });
}
