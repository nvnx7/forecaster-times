import type { ImagePresetKey, StoryRole, StorySection } from "../types";

/** Selects an illustration shape only where it supports the editorial layout. */
export function getImagePreset(
  role: StoryRole,
  section: StorySection,
): ImagePresetKey | null {
  if (role === "front-lead") {
    return "frontLeadWide";
  }

  if (role === "front-secondary" || role === "brief") {
    return null;
  }

  if (role === "section-lead") {
    if (section === "politics" || section === "world") {
      return "sectionLeadPortrait";
    }

    return "sectionLeadWide";
  }

  if (role === "section-secondary") {
    if (section === "culture" || section === "oddities") {
      return "secondarySquare";
    }

    if (section === "sports" || section === "technology") {
      return "secondaryWide";
    }
  }

  return null;
}
