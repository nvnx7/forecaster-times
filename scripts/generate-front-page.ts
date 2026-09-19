import {
  createEditorialEngine,
  logger,
  MockStoryGenerator,
} from "@repo/engine";

import {
  nansenApiBaseUrl,
  nansenApiKey,
  s3AccessKeyId,
  s3BucketName,
  s3Endpoint,
  s3Region,
  s3SecretAccessKey,
  tinyFishApiKey,
} from "./config";

const storyGenerator = new MockStoryGenerator();

const editorialEngine = createEditorialEngine({
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

try {
  logger.info("Front-page generation script started");
  const frontPage = await editorialEngine.publishFrontPage();
  logger.info("Front-page generation script completed", {
    editionId: frontPage.edition.id,
    objectKey: editorialEngine.frontPageKey,
  });
} catch (error) {
  logger.error("Front-page generation script failed", {
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
