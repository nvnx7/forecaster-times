export const editorialConfig = {
  editionWindowSeconds: 24 * 60 * 60,
  liveMetricsTtlSeconds: 60,
  editionRefreshLeadSeconds: 5 * 60,
  story: {
    kickerMaxWords: 6,
    headline: {
      longMaxWords: 18,
      mediumMaxWords: 12,
      shortMaxWords: 7,
    },
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
} as const;
