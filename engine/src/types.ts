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
  openInterestUsd?: number;
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
  pageNumber: number;
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

export type PolymarketMarketSortField =
  | "volume_24hr"
  | "volume"
  | "volume_1wk"
  | "volume_1mo"
  | "liquidity"
  | "open_interest"
  | "unique_traders_24h"
  | "age_hours";

export type ListPolymarketMarketsParams = {
  orderBy?: { field: PolymarketMarketSortField; direction: "ASC" | "DESC" }[];
  status?: "active" | "closed" | "";
  tags?: string[];
  minLiquidity?: number;
  minVolume24hr?: number;
  pagination?: { page?: number; perPage?: number };
};

export type PolymarketMarket = {
  market_id: string;
  question?: string | null;
  slug?: string | null;
  event_id?: string | null;
  event_title?: string | null;
  active?: boolean | null;
  closed?: boolean | null;
  end_date?: string | null;
  tags?: string[] | null;
  volume?: number | null;
  volume_24hr?: number | null;
  liquidity?: number | null;
  open_interest?: number | null;
  best_bid?: number | null;
  best_ask?: number | null;
  last_trade_price?: number | null;
  one_day_price_change?: number | null;
  unique_traders_24h?: number | null;
};

export type ListPolymarketMarketsResponse = {
  pagination?: { page: number; per_page: number; is_last_page: boolean };
  data: PolymarketMarket[];
};
