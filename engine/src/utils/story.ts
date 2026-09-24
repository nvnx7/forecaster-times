import type { PageConfig } from "../config";
import type { CategoryPageId, StoryRole } from "../types";

export function getStoryRole(config: PageConfig, index: number): StoryRole {
  if (config.kind === "front") {
    return index === 0 ? "front-lead" : "front-secondary";
  }
  return index === 0 ? "category-lead" : "category-secondary";
}

export function getIllustrationSource(
  pageId: CategoryPageId,
  storyId: string,
): string {
  const encodedStoryId = encodeURIComponent(storyId);
  return pageId === "front"
    ? `/api/front/illustrations/${encodedStoryId}`
    : `/api/categories/${pageId}/illustrations/${encodedStoryId}`;
}
