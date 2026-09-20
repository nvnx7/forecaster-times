import type { ImageAspectRatio, ImagePresetKey } from "./types";

export type ImagePreset = {
  aspectRatio: ImageAspectRatio;
};

export const IMAGE_PRESETS: Record<ImagePresetKey, ImagePreset> = {
  frontLeadWide: { aspectRatio: "3:2" },
  sectionLeadWide: { aspectRatio: "3:2" },
  sectionLeadPortrait: { aspectRatio: "4:5" },
  secondaryWide: { aspectRatio: "3:2" },
  secondarySquare: { aspectRatio: "1:1" },
};

export const imageGenerationConfig = {
  dimensionsByAspectRatio: {
    "3:2": { width: 768, height: 512 },
    "4:5": { width: 512, height: 640 },
    "1:1": { width: 512, height: 512 },
  } satisfies Record<ImageAspectRatio, { width: number; height: number }>,
  stylePrompt:
    "Vintage newspaper editorial illustration, black ink engraving, 19th-century woodcut and cross-hatching style, monochrome, high contrast, off-white paper, no text, no typography, clear editorial composition, historically printed newspaper aesthetic.",
} as const;

export type EditorialEngineConfig = {
  editionWindowSeconds: number;
  generationTimeoutMs: number;
  generationRetryCount: number;
  generationRetryBaseDelayMs: number;
  story: {
    maxInputCharacters: number;
    maxCompletionTokens: number;
    kickerMaxWords: number;
    headline: {
      longMaxWords: number;
      mediumMaxWords: number;
      shortMaxWords: number;
    };
    dekMaxWords: number;
    body: {
      minBlocks: number;
      maxBlocks: number;
      paragraphMaxWords: number;
      pullquoteMaxWords: number;
      subheadingMaxWords: number;
      maxWords: number;
    };
  };
};

export const defaultEditorialEngineConfig: EditorialEngineConfig = {
  editionWindowSeconds: 24 * 60 * 60,
  generationTimeoutMs: 120_000,
  generationRetryCount: 2,
  generationRetryBaseDelayMs: 1_000,
  story: {
    maxInputCharacters: 8_000,
    maxCompletionTokens: 500,
    kickerMaxWords: 6,
    headline: { longMaxWords: 18, mediumMaxWords: 12, shortMaxWords: 7 },
    dekMaxWords: 32,
    body: {
      minBlocks: 3,
      maxBlocks: 5,
      paragraphMaxWords: 75,
      pullquoteMaxWords: 24,
      subheadingMaxWords: 8,
      maxWords: 300,
    },
  },
};
