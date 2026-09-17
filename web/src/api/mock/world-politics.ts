import type { SectionPage } from "@/types";

export const mockWorldPoliticsPage = {
  pageNumber: 2,
  section: {
    id: "world-politics",
    label: "World & Politics",
    shortLabel: "WORLD",
    description: "Elections, diplomacy, government and affairs of consequence.",
  },
  edition: {
    id: "edition-001",
    date: "2026-09-17",
    displayDate: "Thursday, September 17, 2026",
    editionLabel: "Morning Edition",
  },
  layoutVariant: "section-lead",
  leadStory: {
    id: "election-market-tightens",
    category: "politics",
    kicker: "Elections",
    headline: {
      long: "Presidential Race Narrows as Markets Reprice the Contest",
      medium: "Presidential Race Narrows",
      short: "Race Narrows",
    },
    dek: "The leading outcome has fallen to 53%, while its nearest rival has climbed steadily over the past day.",
    body: [
      {
        type: "paragraph",
        text: "Prediction markets tightened sharply overnight as traders reduced their confidence in the leading presidential outcome.",
      },
      {
        type: "paragraph",
        text: "The frontrunner now trades near 53 cents, down seven points over the past twenty-four hours, while the nearest competing outcome has attracted renewed buying.",
      },
      {
        type: "pullquote",
        text: "The race has moved from comfortable advantage to near toss-up territory.",
      },
      {
        type: "paragraph",
        text: "Trading activity has also accelerated, with both volume and the number of active participants rising during the repricing.",
      },
    ],
    market: {
      marketId: "politics-election-001",
      question: "Will Candidate A win the presidential election?",
      yes: 0.53,
      no: 0.47,
      change24h: -0.07,
      volume24hUsd: 21_600_000,
      liquidityUsd: 9_100_000,
      openInterestUsd: 28_400_000,
      placement: "float-right",
    },
    illustration: {
      src: "/mock/newspaper-placeholder.png",
      alt: "Vintage newspaper engraving of an election rally",
      caption:
        "Prediction markets have sharply narrowed their view of the race.",
      placement: "wide",
    },
  },
  secondaryStories: [
    {
      id: "ceasefire-odds-rise",
      category: "world",
      kicker: "Diplomacy",
      headline: {
        long: "Ceasefire Expectations Rise as Traders Turn More Optimistic",
        medium: "Ceasefire Expectations Rise",
        short: "Ceasefire Odds Rise",
      },
      dek: "The market-implied probability has climbed nine points to 61%.",
      body: [
        {
          type: "paragraph",
          text: "Prediction traders became materially more optimistic about the prospect of a near-term ceasefire, sending the relevant contract above 60 cents.",
        },
        {
          type: "paragraph",
          text: "The move follows several days of relatively stable pricing and marks one of the largest geopolitical repricings in today's market.",
        },
      ],
      market: {
        marketId: "world-ceasefire-001",
        question: "Will a ceasefire be agreed before October 31?",
        yes: 0.61,
        no: 0.39,
        change24h: 0.09,
        volume24hUsd: 7_400_000,
        placement: "float-left",
      },
    },
    {
      id: "government-shutdown",
      category: "politics",
      kicker: "Washington",
      headline: {
        long: "Shutdown Fears Ease as Market Odds Fall Below One in Three",
        medium: "Shutdown Fears Ease",
        short: "Shutdown Odds Fall",
      },
      dek: "The probability of a government shutdown has fallen to 29%.",
      body: [
        {
          type: "paragraph",
          text: "Traders have reduced their expectations of a government shutdown, pushing the market below the 30% threshold.",
        },
        {
          type: "paragraph",
          text: "The contract has lost seven points over the past day amid heavier-than-usual trading.",
        },
      ],
      market: {
        marketId: "politics-shutdown-001",
        question: "Will the government shut down before October 15?",
        yes: 0.29,
        no: 0.71,
        change24h: -0.07,
        volume24hUsd: 5_300_000,
        placement: "float-right",
      },
    },
  ],
  briefs: [
    {
      id: "brief-world-1",
      category: "world",
      kicker: "Europe",
      headline: "Coalition Talks Seen Extending Into Next Week",
      summary:
        "The market assigns a 68% chance that negotiations continue beyond Monday.",
      probability: 0.68,
      change24h: 0.04,
    },
    {
      id: "brief-world-2",
      category: "politics",
      kicker: "Congress",
      headline: "Budget Bill Passage Moves Back Above 70%",
      summary: "Traders have become more confident after a volatile week.",
      probability: 0.72,
      change24h: 0.06,
    },
    {
      id: "brief-world-3",
      category: "world",
      kicker: "Asia",
      headline: "Trade Agreement Remains a Coin Toss",
      summary: "The contract sits almost exactly at 50%.",
      probability: 0.51,
      change24h: -0.01,
    },
    {
      id: "brief-world-4",
      category: "politics",
      kicker: "Election Watch",
      headline: "Incumbent's Re-Election Odds Slip Again",
      summary: "The market has fallen six points over three days.",
      probability: 0.44,
      change24h: -0.03,
    },
  ],
  sidebar: {
    type: "changes",
    title: "What Changed Since Yesterday",
    items: [
      {
        id: "change-1",
        label: "Candidate A wins election",
        previousProbability: 0.6,
        probability: 0.53,
        change: -0.07,
      },
      {
        id: "change-2",
        label: "Ceasefire before Oct. 31",
        previousProbability: 0.52,
        probability: 0.61,
        change: 0.09,
      },
      {
        id: "change-3",
        label: "Government shutdown",
        previousProbability: 0.36,
        probability: 0.29,
        change: -0.07,
      },
      {
        id: "change-4",
        label: "Budget bill passes",
        previousProbability: 0.66,
        probability: 0.72,
        change: 0.06,
      },
    ],
  },
  marketBoard: {
    title: "World & Politics Market Board",
    subtitle: "Selected probabilities from today's active markets.",
    items: [
      {
        id: "board-1",
        label: "Candidate A wins election",
        probability: 0.53,
        change24h: -0.07,
        volume24hUsd: 21_600_000,
      },
      {
        id: "board-2",
        label: "Ceasefire before Oct. 31",
        probability: 0.61,
        change24h: 0.09,
        volume24hUsd: 7_400_000,
      },
      {
        id: "board-3",
        label: "Government shutdown",
        probability: 0.29,
        change24h: -0.07,
        volume24hUsd: 5_300_000,
      },
      {
        id: "board-4",
        label: "Budget bill passes",
        probability: 0.72,
        change24h: 0.06,
        volume24hUsd: 3_800_000,
      },
      {
        id: "board-5",
        label: "Trade agreement signed",
        probability: 0.51,
        change24h: -0.01,
        volume24hUsd: 1_900_000,
      },
    ],
  },
} satisfies SectionPage;
