import {
  CloudflareStoryImageGenerator,
  CloudflareWorkersAiClient,
  createEditorialEngine,
  defaultEditorialConfig,
  FallbackStoryGenerator,
  FallbackStoryImageGenerator,
  logger,
  OpenRouterAIClient,
  OpenRouterStoryGenerator,
  OpenRouterStoryImageGenerator,
  openRouterImageGenerationCandidates,
  openRouterStoryGenerationCandidates,
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
} from "@/config/env";

export { logger };

const cloudflareClient = new CloudflareWorkersAiClient({
  accountId: cloudflareAccountId,
  apiToken: cloudflareApiKey,
});

const storyGenerator = new FallbackStoryGenerator({
  generators: openRouterStoryGenerationCandidates.map(
    ({ model, reasoningEffort }) =>
      new OpenRouterStoryGenerator({
        client: new OpenRouterAIClient({
          apiKey: openRouterApiKey,
          model,
          appName: "Probability Press",
        }),
        config: defaultEditorialConfig,
        reasoningEffort,
      }),
  ),
});

const storyImageGenerator = new FallbackStoryImageGenerator({
  generators: [
    new CloudflareStoryImageGenerator({
      client: cloudflareClient,
    }),
    ...openRouterImageGenerationCandidates.map(
      ({ model, ...imageOptions }) =>
        new OpenRouterStoryImageGenerator({
          client: new OpenRouterAIClient({
            apiKey: openRouterApiKey,
            model,
            appName: "Probability Press",
          }),
          imageOptions,
        }),
    ),
  ],
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
