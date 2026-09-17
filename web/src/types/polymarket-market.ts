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
  /** Nansen applies multiple sort fields in their listed order. */
  orderBy?: {
    field: PolymarketMarketSortField;
    direction: "ASC" | "DESC";
  }[];
  status?: "active" | "closed" | "";
  tags?: string[];
  minLiquidity?: number;
  minVolume24hr?: number;
  pagination?: {
    page?: number;
    perPage?: number;
  };
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
  pagination?: {
    page: number;
    per_page: number;
    is_last_page: boolean;
  };
  data: PolymarketMarket[];
};
