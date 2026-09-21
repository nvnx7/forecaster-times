import { logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const editorialEngine = createScriptEditorialEngine();

try {
  logger.info("Edition generation requested by front-page script");
  const frontPage = await editorialEngine.publishFrontPage();
  logger.info("Edition generation completed", {
    editionId: frontPage.edition.id,
    objectKey: editorialEngine.frontPageKey,
  });
} catch (error) {
  logger.error("Edition generation failed", {
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
