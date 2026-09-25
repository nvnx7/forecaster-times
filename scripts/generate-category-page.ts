import { type CategoryPageId, categoryPageConfigs, logger } from "@repo/engine";

import { createScriptEditorialEngine } from "./editorial-engine";

const categoryIds = process.argv.slice(2);
if (
  categoryIds.some(
    (categoryId) => !Object.hasOwn(categoryPageConfigs, categoryId),
  )
) {
  throw new Error(
    `Category IDs: ${Object.keys(categoryPageConfigs).join(", ")}`,
  );
}

const editorialEngine = createScriptEditorialEngine();

try {
  logger.info("Category-page draft generation requested by script", {
    categoryIds,
  });
  const pages = await editorialEngine.draftCategoryPages(
    categoryIds as Exclude<CategoryPageId, "front">[],
  );
  logger.info("Category-page draft generation completed", {
    categoryIds: [...pages.keys()],
    editionId: pages.values().next().value?.edition.id,
  });
} catch (error) {
  logger.error("Category-page draft generation failed", {
    categoryIds,
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
