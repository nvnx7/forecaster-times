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
  logger.info("Category-page generation script started", { categoryId });
  const page = await editorialEngine.publishCategoryPage(
    categoryId as CategoryPageId,
  );
  logger.info("Category-page generation script completed", {
    categoryId,
    editionId: page.edition.id,
  });
} catch (error) {
  logger.error("Category-page generation script failed", {
    categoryId,
    message: error instanceof Error ? error.message : "Unknown error",
  });
  process.exitCode = 1;
}
