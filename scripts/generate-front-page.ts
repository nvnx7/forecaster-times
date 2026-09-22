import { logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const editorialEngine = createScriptEditorialEngine();

try {
  logger.info("Front-page draft generation requested by script");
  const frontPage = await editorialEngine.draftFrontPage();
  logger.info("Front-page draft generation completed", {
    editionId: frontPage.edition.id,
    objectKey: editorialEngine.frontPageDraftKey,
  });
} catch (error) {
  logger.error("Front-page draft generation failed", {
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
