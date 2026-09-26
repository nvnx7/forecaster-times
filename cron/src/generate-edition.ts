import { categoryPageIds, type EditorialEngine, logger } from "@repo/engine";

/** Generates and publishes a complete edition for every configured category. */
export async function generateEdition(engine: EditorialEngine) {
  logger.info("Scheduled edition generation requested", {
    categoryIds: categoryPageIds,
  });

  const pages = await engine.publishEdition(categoryPageIds);
  const frontPage = pages.get("front");
  const result = {
    editionId: frontPage?.edition.id,
    pageIds: [...pages.keys()],
  };
  logger.info("Scheduled edition generation completed", result);
  return result;
}
