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
