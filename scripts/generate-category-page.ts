import { type CategoryPageId, categoryPageConfigs, logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const categoryId = process.argv[2];
if (!categoryId || !Object.hasOwn(categoryPageConfigs, categoryId)) {
  throw new Error(
    `Provide one category id: ${Object.keys(categoryPageConfigs).join(", ")}`,
  );
}

const editorialEngine = createScriptEditorialEngine();

try {
  logger.info("Edition generation requested by category-page script", {
    categoryId,
  });
  const page = await editorialEngine.publishCategoryPage(
    categoryId as CategoryPageId,
  );
  logger.info("Edition generation completed", {
    categoryId,
    editionId: page.edition.id,
  });
} catch (error) {
  logger.error("Edition generation failed", {
    categoryId,
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
