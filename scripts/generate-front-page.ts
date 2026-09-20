import { logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const editorialEngine = createScriptEditorialEngine();

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
