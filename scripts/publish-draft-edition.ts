import { logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const editorialEngine = createScriptEditorialEngine();

try {
  logger.info("Draft edition publication requested by script");
  const pages = await editorialEngine.publishDraftEdition();
  const frontPage = pages.get("front");
  logger.info("Draft edition publication completed", {
    editionId: frontPage?.edition.id,
    pageIds: [...pages.keys()],
  });
} catch (error) {
  logger.error("Draft edition publication failed", {
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
