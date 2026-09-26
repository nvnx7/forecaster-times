import { type CategoryPageId, logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const categoryIds = [
  "world-politics",
  "money-markets",
  "technology-culture",
  "sports",
  "crypto",
] as const satisfies readonly Exclude<CategoryPageId, "front">[];

const editorialEngine = createScriptEditorialEngine();

try {
  logger.info("Full edition generation requested by script", { categoryIds });
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
