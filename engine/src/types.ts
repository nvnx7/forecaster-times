export type StoryCategory =
  | "world"
  | "politics"
  | "money"
  | "technology"
  | "crypto"
  | "sports"
  | "culture"
  | "oddities";

export type ImageAspectRatio = "3:2" | "4:5" | "1:1";

export type ImagePresetKey =
  | "frontLeadWide"
  | "categoryLeadWide"
  | "categoryLeadPortrait"
  | "secondaryWide"
  | "secondarySquare";

export type StoryRole =
  | "front-lead"
  | "front-secondary"
  | "category-lead"
  | "category-secondary"
  | "brief";

export type ParagraphBlock =
  | { type: "paragraph"; text: string }
  | { type: "pullquote"; text: string }
  | { type: "subheading"; text: string };

export type MarketPanel = {
  marketId: string;
  question: string;
  marketReference?: MarketReference;
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
  aspectRatio?: ImageAspectRatio;
  asset?: {
    objectKey: string;
    contentType: string;
    preset: ImagePresetKey;
  };
};

export type Story = {
  id: string;
  category: StoryCategory;
  kicker?: string;
  headline: { long: string; medium: string; short: string };
  dek?: string;
  body: ParagraphBlock[];
  byline?: string;
  market?: MarketPanel;
  illustration?: Illustration;
  meta?: { publishedAt?: string; updatedAt?: string; sourceLabel?: string };
};

export type StorySource = {
  url: string;
  final_url: string | null;
  title: string | null;
  description: string | null;
  language: string | null;
  format: "markdown";
  text: string;
  author?: string | null;
  published_date?: string | null;
};

export type Brief = {
  id: string;
  category: StoryCategory;
  headline: string;
  summary?: string;
  probability?: number;
  change24h?: number;
  market?: MarketReference;
};

/**
 * Immutable market context saved with an edition.
 *
 * Price, volume, and liquidity are deliberately excluded: callers should
 * refresh those values from Nansen when they need a live quote.
 */
export type MarketReference = {
  marketId: string;
  question: string;
  slug?: string;
  eventId?: string;
  eventTitle?: string;
  active?: boolean;
  closed?: boolean;
  endDate?: string;
  negRisk?: boolean;
  tags: string[];
  createdAt?: string;
};

export type FrontPageHotMarket = {
  market: MarketReference;
  probability: number;
  change24h?: number;
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
    now: string;
  };
  leadStory: Story;
  secondaryStories: Story[];
  briefs: Brief[];
  hotMarkets: FrontPageHotMarket[];
  sidebar?: SidebarBlock;
  footerStories?: Story[];
};

export type FrontPageDraftStory = {
  market: PolymarketMarket;
  sources: StorySource[];
  story?: Story;
  attemptCount: number;
  lastError?: string;
  illustrationAttemptCount?: number;
  illustrationLastError?: string;
};

export type FrontPageDraft = {
  version: 1;
  edition: FrontPage["edition"];
  marketCandidates: PolymarketMarket[];
  briefMarkets: PolymarketMarket[];
  stories: FrontPageDraftStory[];
  createdAt: string;
  updatedAt: string;
};

export type CategoryPageId =
  | "world-politics"
  | "money-markets"
  | "technology-culture"
  | "sports"
  | "odds-oddities";

export type CategoryLayoutVariant =
  | "category-lead"
  | "dense"
  | "visual-lead"
  | "market-heavy";

export type CategoryStory = Story & {
  continuation?: { label: string; pageNumber: number };
};

export type CategoryBrief = {
  id: string;
  category: StoryCategory;
  kicker?: string;
  headline: string;
  summary?: string;
  probability?: number;
  change24h?: number;
  market?: MarketReference;
};

export type CategorySidebar =
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

export type CategoryMarketBoard = {
  title: string;
  subtitle?: string;
  items: {
    id: string;
    label: string;
    probability: number;
    change24h?: number;
    volume24hUsd?: number;
    market: MarketReference;
  }[];
};

export type CategoryPage = {
  pageNumber: number;
  category: {
    id: CategoryPageId;
    label: string;
    shortLabel?: string;
    description?: string;
  };
  edition: { id: string; now: string };
  layoutVariant: CategoryLayoutVariant;
  leadStory: CategoryStory;
  secondaryStories: CategoryStory[];
  briefs: CategoryBrief[];
  sidebar?: CategorySidebar;
  marketBoard?: CategoryMarketBoard;
  footerStories?: CategoryBrief[];
};

export type CategoryPageDraftStory = FrontPageDraftStory;

export type CategoryPageDraft = {
  version: 1;
  categoryId: CategoryPageId;
  edition: CategoryPage["edition"];
  marketCandidates: PolymarketMarket[];
  briefMarkets: PolymarketMarket[];
  stories: CategoryPageDraftStory[];
  createdAt: string;
  updatedAt: string;
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
  neg_risk?: boolean | null;
  tags?: string[] | null;
  volume?: number | null;
  volume_24hr?: number | null;
  volume_1wk?: number | null;
  volume_1mo?: number | null;
  liquidity?: number | null;
  volume_change_pct?: number | null;
  open_interest?: number | null;
  best_bid?: number | null;
  best_ask?: number | null;
  last_trade_price?: number | null;
  one_day_price_change?: number | null;
  unique_traders_24h?: number | null;
  created_at?: string | null;
  age_hours?: number | null;
};

export type ListPolymarketMarketsResponse = {
  pagination?: { page: number; per_page: number; is_last_page: boolean };
  data: PolymarketMarket[];
};
