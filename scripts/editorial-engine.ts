import {
  CloudflareStoryImageGenerator,
  CloudflareWorkersAiClient,
  createEditorialEngine,
  defaultEditorialConfig,
  GroqAIClient,
  GroqStoryGenerator,
} from "@repo/engine";

import {
  cloudflareAccountId,
  cloudflareApiKey,
  groqApiKey,
  nansenApiBaseUrl,
  nansenApiKey,
  s3AccessKeyId,
  s3BucketName,
  s3Endpoint,
  s3Region,
  s3SecretAccessKey,
  tinyFishApiKey,
} from "./config";

/** Creates the same fully configured engine used by every local editorial job. */
export function createScriptEditorialEngine() {
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
    storyGenerator: new GroqStoryGenerator({
      client: new GroqAIClient({ apiKey: groqApiKey }),
      config: defaultEditorialConfig,
    }),
    storyImageGenerator: new CloudflareStoryImageGenerator({
      client: new CloudflareWorkersAiClient({
        accountId: cloudflareAccountId,
        apiToken: cloudflareApiKey,
      }),
    }),
  });
}
