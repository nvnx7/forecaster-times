import type {
  CategoryLayoutVariant,
  CategoryPageId,
  ImageAspectRatio,
  ImagePresetKey,
  StoryCategory,
} from "./types";

export type ImagePreset = {
  aspectRatio: ImageAspectRatio;
};

export const imagePresets: Record<ImagePresetKey, ImagePreset> = {
  frontLeadWide: { aspectRatio: "3:2" },
  categoryLeadWide: { aspectRatio: "3:2" },
  categoryLeadPortrait: { aspectRatio: "4:5" },
  secondaryWide: { aspectRatio: "3:2" },
  secondarySquare: { aspectRatio: "1:1" },
};

export const imageGenerationConfig = {
  dimensionsByAspectRatio: {
    "3:2": { width: 512, height: 341 },
    "4:5": { width: 410, height: 512 },
    "1:1": { width: 512, height: 512 },
  } satisfies Record<ImageAspectRatio, { width: number; height: number }>,
  stylePrompt:
    "Vintage newspaper editorial illustration in black ink engraving style, 19th-century woodcut, detailed cross-hatching, monochrome, off-white paper, strong single-scene composition, historically printed appearance.",
} as const;

export const openRouterStoryGenerationCandidates = [
  { model: "openai/gpt-oss-120b", reasoningEffort: "minimal" },
  { model: "openai/gpt-oss-20b", reasoningEffort: "minimal" },
  { model: "qwen/qwen3.7-flash", reasoningEffort: "minimal" },
] as const;

export const openRouterImageGenerationCandidates = [
  {
    model: "black-forest-labs/flux.2-klein-4b",
    outputFormat: "png",
    resolution: "512",
  },
  {
    model: "recraft/recraft-v4.1-flash",
    aspectRatioByPreset: {
      "3:2": "4:3",
      "4:5": "3:4",
      "1:1": "1:1",
    },
    n: 1,
  },
  {
    model: "qwen/qwen-image-3",
    outputFormat: "png",
    resolution: "512",
  },
] as const;

export type CategoryPageConfig = {
  kind: "category";
  pageNumber: number;
  label: string;
  shortLabel: string;
  description: string;
  layoutVariant: CategoryLayoutVariant;
  storyCategory: StoryCategory;
  nansenTags: string[];
  sidebar: { type: "changes" | "movers" | "odds"; title: string };
  candidateLimit: number;
  storyCount: number;
  briefCount: number;
  marketBoardCount: number;
};

export type FrontPageConfig = {
  kind: "front";
  pageNumber: 1;
  candidateLimit: number;
  storyCount: number;
  briefCount: number;
};

export type PageConfig = CategoryPageConfig | FrontPageConfig;

export const pageConfigs: Record<CategoryPageId, PageConfig> = {
  front: {
    kind: "front",
    pageNumber: 1,
    candidateLimit: 10,
    storyCount: 3,
    briefCount: 3,
  },
  "world-politics": {
    kind: "category",
    pageNumber: 2,
    label: "World & Politics",
    shortLabel: "World",
    description: "Elections, diplomacy, government and affairs of consequence.",
    layoutVariant: "category-lead",
    storyCategory: "world",
    nansenTags: ["World", "Politics", "Elections", "Geopolitics"],
    sidebar: { type: "changes", title: "What Changed Since Yesterday" },
    candidateLimit: 16,
    storyCount: 3,
    briefCount: 4,
    marketBoardCount: 6,
  },
  "money-markets": {
    kind: "category",
    pageNumber: 3,
    label: "Money & Markets",
    shortLabel: "Money",
    description: "Economy, rates, markets and the wagers moving them.",
    layoutVariant: "market-heavy",
    storyCategory: "money",
    nansenTags: ["Finance", "Economy"],
    sidebar: { type: "movers", title: "Market Movers" },
    candidateLimit: 16,
    storyCount: 3,
    briefCount: 4,
    marketBoardCount: 6,
  },
  "technology-culture": {
    kind: "category",
    pageNumber: 4,
    label: "Technology & Culture",
    shortLabel: "Technology",
    description: "The machine age, culture, and the stories gathering force.",
    layoutVariant: "visual-lead",
    storyCategory: "technology",
    nansenTags: ["Technology", "Entertainment"],
    sidebar: { type: "odds", title: "At a Glance" },
    candidateLimit: 16,
    storyCount: 3,
    briefCount: 4,
    marketBoardCount: 6,
  },
  sports: {
    kind: "category",
    pageNumber: 5,
    label: "Sports",
    shortLabel: "Sports",
    description: "Fixtures, championships, and the odds behind the contest.",
    layoutVariant: "visual-lead",
    storyCategory: "sports",
    nansenTags: ["Sports"],
    sidebar: { type: "movers", title: "Market Movers" },
    candidateLimit: 16,
    storyCount: 3,
    briefCount: 4,
    marketBoardCount: 6,
  },
  "odds-oddities": {
    kind: "category",
    pageNumber: 6,
    label: "Odds & Oddities",
    shortLabel: "Oddities",
    description: "The unusual bets and improbable outcomes of the day.",
    layoutVariant: "dense",
    storyCategory: "oddities",
    nansenTags: ["Crypto", "Entertainment"],
    sidebar: { type: "odds", title: "The Long Odds" },
    candidateLimit: 16,
    storyCount: 3,
    briefCount: 4,
    marketBoardCount: 6,
  },
};

export const categoryPageConfigs = Object.fromEntries(
  Object.entries(pageConfigs).filter(([pageId]) => pageId !== "front"),
) as Record<Exclude<CategoryPageId, "front">, CategoryPageConfig>;

export const categoryPageIds = Object.keys(categoryPageConfigs) as Exclude<
  CategoryPageId,
  "front"
>[];

export type EditorialEngineConfig = {
  draftExpirySeconds: number;
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
  draftExpirySeconds: 12 * 60 * 60,
  generationTimeoutMs: 120_000,
  generationRetryCount: 2,
  generationRetryBaseDelayMs: 1_000,
  story: {
    maxInputCharacters: 8_000,
    maxCompletionTokens: 1_500,
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
