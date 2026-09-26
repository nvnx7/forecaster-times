import type { CategoryPageId } from "./types";
import { getImageExtension } from "./utils";

export const latestEditionKey = "latest.json";
export const draftRootPrefix = "draft/";
export const draftWorkPrefix = "draft/work/";
export const draftPublishablePrefix = "draft/publishable/";

export const draftWorkStateKey = `${draftWorkPrefix}state.json`;

function editionDirectory(editionId: number): string {
  if (!Number.isSafeInteger(editionId) || editionId < 1) {
    throw new Error("Edition IDs must be positive integers.");
  }
  return `edition-${editionId}`;
}

export function editionPrefix(editionId: number): string {
  return `${editionDirectory(editionId)}/`;
}

export function draftWorkPageKey(pageId: CategoryPageId): string {
  return `${draftWorkPrefix}pages/${pageId}.json`;
}

export function draftPublishablePageKey(pageId: CategoryPageId): string {
  return `${draftPublishablePrefix}pages/${pageId}.json`;
}

export function editionPageKey(
  editionId: number,
  pageId: CategoryPageId,
): string {
  return `${editionPrefix(editionId)}pages/${pageId}.json`;
}

export function draftPublishableIllustrationKey(
  pageId: CategoryPageId,
  storyId: string,
  contentType: string,
): string {
  return `${draftPublishableIllustrationPrefix(pageId)}${encodeURIComponent(storyId)}.${getImageExtension(contentType)}`;
}

export function draftPublishableIllustrationPrefix(
  pageId: CategoryPageId,
): string {
  return `${draftPublishablePrefix}illustrations/${pageId}/`;
}

export function editionIllustrationKey(
  editionId: number,
  pageId: CategoryPageId,
  storyId: string,
  contentType: string,
): string {
  return `${editionPrefix(editionId)}illustrations/${pageId}/${encodeURIComponent(storyId)}.${getImageExtension(contentType)}`;
}

export const draftPublishableManifestKey = `${draftPublishablePrefix}manifest.json`;

export function editionManifestKey(editionId: number): string {
  return `${editionPrefix(editionId)}manifest.json`;
}
