import type {
  Illustration,
  MarketPanel,
  ParagraphBlock,
  StorySection,
} from "./front-page";

export type SectionPageId =
  | "world-politics"
  | "money-markets"
  | "technology-culture"
  | "sports"
  | "odds-oddities";

export type SectionLayoutVariant =
  | "section-lead"
  | "dense"
  | "visual-lead"
  | "market-heavy";

export type SectionStory = {
  id: string;
  category: StorySection;
  kicker?: string;
  headline: { long: string; medium: string; short: string };
  dek?: string;
  body: ParagraphBlock[];
  byline?: string;
  market?: MarketPanel;
  illustration?: Illustration;
  continuation?: { label: string; pageNumber: number };
  meta?: { publishedAt?: string; updatedAt?: string; sourceLabel?: string };
};

export type SectionBrief = {
  id: string;
  category: StorySection;
  kicker?: string;
  headline: string;
  summary?: string;
  probability?: number;
  change24h?: number;
  marketId?: string;
};

export type SectionSidebar =
  | {
      type: "changes";
      title: string;
      items: {
        id: string;
        label: string;
        previousProbability: number;
        probability: number;
        change: number;
      }[];
    }
  | {
      type: "movers";
      title: string;
      items: {
        id: string;
        label: string;
        probability: number;
        change24h: number;
      }[];
    }
  | {
      type: "odds";
      title: string;
      items: { id: string; label: string; probability: number }[];
    }
  | { type: "text"; title: string; body: string };

export type MarketBoard = {
  title: string;
  subtitle?: string;
  items: {
    id: string;
    label: string;
    probability: number;
    change24h?: number;
    volume24hUsd?: number;
  }[];
};

export type SectionPage = {
  pageNumber: number;
  section: {
    id: SectionPageId;
    label: string;
    shortLabel?: string;
    description?: string;
  };
  edition: {
    id: string;
    date: string;
    displayDate: string;
    editionLabel?: string;
  };
  layoutVariant: SectionLayoutVariant;
  leadStory: SectionStory;
  secondaryStories: SectionStory[];
  briefs: SectionBrief[];
  sidebar?: SectionSidebar;
  marketBoard?: MarketBoard;
  footerStories?: SectionBrief[];
};
