import type { CategoryPageId } from "./types";
import { getImageExtension } from "./utils";

export const latestEditionKey = "latest.json";
export const draftStateKey = "draft/state.json";

function editionDirectory(editionId: number): string {
  if (!Number.isSafeInteger(editionId) || editionId < 1) {
    throw new Error("Edition IDs must be positive integers.");
  }
  return `edition-${editionId}`;
}

export function draftPageKey(pageId: CategoryPageId): string {
  return `draft/pages/${pageId}.json`;
}

export function editionPageKey(
  editionId: number,
  pageId: CategoryPageId,
): string {
  return `${editionDirectory(editionId)}/pages/${pageId}.json`;
}

export function draftIllustrationKey(
  pageId: CategoryPageId,
  storyId: string,
  contentType: string,
): string {
  return `draft/illustrations/${pageId}/${encodeURIComponent(storyId)}.${getImageExtension(contentType)}`;
}

export function editionIllustrationKey(
  editionId: number,
  pageId: CategoryPageId,
  storyId: string,
  contentType: string,
): string {
  return `${editionDirectory(editionId)}/illustrations/${pageId}/${encodeURIComponent(storyId)}.${getImageExtension(contentType)}`;
}
