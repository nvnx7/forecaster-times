export type StorySection =
  | "world"
  | "politics"
  | "money"
  | "technology"
  | "crypto"
  | "sports"
  | "culture"
  | "oddities";

export type ParagraphBlock =
  | { type: "paragraph"; text: string }
  | { type: "pullquote"; text: string }
  | { type: "subheading"; text: string };

export type MarketPanel = {
  marketId: string;
  question: string;
  yes: number;
  no: number;
  change24h?: number;
  volume24hUsd?: number;
  liquidityUsd?: number;
  tradeUrl?: string;
  placement?: "float-left" | "float-right" | "full-width";
};

export type Illustration = {
  src: string;
  alt: string;
  caption?: string;
  credit?: string;
  placement?: "wide" | "float-left" | "float-right";
};

export type Story = {
  id: string;
  section: StorySection;
  kicker?: string;
  headline: { long: string; medium: string; short: string };
  dek?: string;
  body: ParagraphBlock[];
  byline?: string;
  market?: MarketPanel;
  illustration?: Illustration;
  meta?: { publishedAt?: string; updatedAt?: string; sourceLabel?: string };
};

export type Brief = {
  id: string;
  section: StorySection;
  headline: string;
  summary?: string;
  probability?: number;
  change24h?: number;
};

export type MarketStrip = {
  title: string;
  items: {
    id: string;
    label: string;
    probability: number;
    change24h?: number;
  }[];
};

export type SidebarBlock =
  | {
      type: "movers";
      title: string;
      items: { label: string; probability: number; change24h: number }[];
    }
  | {
      type: "odds";
      title: string;
      items: { label: string; probability: number }[];
    }
  | { type: "text"; title: string; body: string };

export type FrontPage = {
  edition: {
    id: string;
    date: string;
    displayDate: string;
    editionLabel?: string;
    tagline?: string;
  };
  leadStory: Story;
  secondaryStories: Story[];
  briefs: Brief[];
  marketStrip?: MarketStrip;
  sidebar?: SidebarBlock;
  footerStories?: Story[];
};
