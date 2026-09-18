import type { EditorialLogger } from "./logger";
import type { StoryGenerator } from "./story-generators/interface";

export type EditorialConfig = {
  editionWindowSeconds: number;
  generationTimeoutMs: number;
  generationRetryCount: number;
  generationRetryBaseDelayMs: number;
  story: {
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

export type EditorialEngineOptions = {
  nansen: { apiKey: string; baseUrl: string };
  s3: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
    forcePathStyle?: boolean;
    frontPageObjectKey?: string;
  };
  storyGenerator: StoryGenerator;
  logger?: EditorialLogger;
};

export const defaultEditorialConfig: EditorialConfig = {
  editionWindowSeconds: 24 * 60 * 60,
  generationTimeoutMs: 120_000,
  generationRetryCount: 2,
  generationRetryBaseDelayMs: 1_000,
  story: {
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
