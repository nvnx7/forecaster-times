import type { ImagePresetKey, StoryCategory, StoryRole } from "../types";

/** Selects an illustration shape only where it supports the editorial layout. */
export function getImagePreset(
  role: StoryRole,
  category: StoryCategory,
): ImagePresetKey | null {
  if (role === "front-lead") {
    return "frontLeadWide";
  }

  if (role === "front-secondary" || role === "brief") {
    return null;
  }

  if (role === "category-lead") {
    if (category === "politics" || category === "world") {
      return "categoryLeadPortrait";
    }

    return "categoryLeadWide";
  }

  if (role === "category-secondary") {
    if (category === "culture" || category === "oddities") {
      return "secondarySquare";
    }

    if (category === "sports" || category === "technology") {
      return "secondaryWide";
    }
  }

  return null;
}
