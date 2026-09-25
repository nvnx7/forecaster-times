import { categoryPageIds, logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const categoryIds = categoryPageIds.slice(0, 2);
const editorialEngine = createScriptEditorialEngine();

try {
  logger.info("Edition generation requested by script", { categoryIds });
  const pages = await editorialEngine.publishEdition(categoryIds);
  const frontPage = pages.get("front");
  logger.info("Edition generation completed", {
    editionId: frontPage?.edition.id,
    pageIds: [...pages.keys()],
  });
} catch (error) {
  logger.error("Edition generation failed", {
    categoryIds,
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
