import type { FrontPage } from "@/types";

export const mockFrontPage = {
  edition: {
    id: "edition-001",
    date: "2026-09-17",
    displayDate: "Thursday, September 17, 2026",
    editionLabel: "Morning Edition",
    tagline: "The Newspaper of What Happens Next",
  },
  leadStory: {
    id: "fed-rate-cut",
    section: "money",
    kicker: "Monetary Policy",
    headline: {
      long: "Markets Now Expect September Rate Cut",
      medium: "Markets Expect September Rate Cut",
      short: "Rate Cut Odds Surge",
    },
    dek: "Prediction traders place the likelihood of a cut at 72%, up 11 points over the past day.",
    body: [
      {
        type: "paragraph",
        text: "Prediction markets sharply repriced expectations for a September rate cut on Wednesday, pushing the implied probability to its highest level this week.",
      },
      {
        type: "paragraph",
        text: "The contract now trades near 72 cents on the dollar, compared with roughly 61 cents twenty-four hours earlier.",
      },
      {
        type: "pullquote",
        text: "The market has moved eleven points in a single day.",
      },
      {
        type: "paragraph",
        text: "Trading activity also accelerated, with volume and participation rising alongside the move.",
      },
    ],
    market: {
      marketId: "market-fed-001",
      question: "Will the Federal Reserve cut rates in September?",
      yes: 0.72,
      no: 0.28,
      change24h: 0.11,
      volume24hUsd: 18_400_000,
      liquidityUsd: 6_200_000,
      placement: "float-right",
    },
    illustration: {
      src: "/mock/newspaper-placeholder.png",
      alt: "Vintage engraving of a central bank building",
      caption:
        "Markets have rapidly repriced expectations for the next policy meeting.",
      placement: "wide",
    },
  },
  secondaryStories: [
    {
      id: "space-launch",
      section: "technology",
      kicker: "Space",
      headline: {
        long: "Launch Odds Rise After Successful Test",
        medium: "Launch Odds Rise",
        short: "Launch Odds Up",
      },
      dek: "Traders now assign a 64% probability to a launch before year-end.",
      body: [
        {
          type: "paragraph",
          text: "A closely watched space-market contract climbed six points over the past day.",
        },
      ],
      market: {
        marketId: "market-space-001",
        question: "Will the launch happen before December 31?",
        yes: 0.64,
        no: 0.36,
        change24h: 0.06,
        volume24hUsd: 2_800_000,
        placement: "float-left",
      },
    },
    {
      id: "championship",
      section: "sports",
      kicker: "Sport",
      headline: {
        long: "Championship Favorite Pulls Away From the Field",
        medium: "Favorite Pulls Away",
        short: "Favorite Extends Lead",
      },
      dek: "The leading side now commands 58% of market probability.",
      body: [
        {
          type: "paragraph",
          text: "The championship market has become increasingly concentrated around the current favorite.",
        },
      ],
    },
  ],
  briefs: [
    {
      id: "brief-1",
      section: "politics",
      headline: "Election Market Tightens Overnight",
      summary: "The leading outcome fell four points.",
      probability: 0.51,
      change24h: -0.04,
    },
  ],
  sidebar: {
    type: "movers",
    title: "Movers & Shakers",
    items: [
      {
        label: "Fed cuts rates in September",
        probability: 0.72,
        change24h: 0.11,
      },
      { label: "Government shutdown", probability: 0.29, change24h: -0.07 },
      { label: "Launch before year-end", probability: 0.64, change24h: 0.06 },
    ],
  },
  marketStrip: {
    title: "The Morning Odds",
    items: [
      { id: "odds-1", label: "Rate cut", probability: 0.72, change24h: 0.11 },
      { id: "odds-2", label: "BTC record", probability: 0.37, change24h: 0.03 },
      { id: "odds-3", label: "Shutdown", probability: 0.29, change24h: -0.07 },
      { id: "odds-4", label: "Launch", probability: 0.64, change24h: 0.06 },
    ],
  },
} satisfies FrontPage;
