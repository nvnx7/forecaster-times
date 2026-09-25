export type {
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
  PolymarketMarket,
  PolymarketMarketSortField,
} from "@repo/engine";

export type PolymarketMarketOhlcvCandle = {
  market_id: string;
  token_id: string;
  side: string;
  outcome_index: number;
  period_start: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume_usd: number;
  trade_count: number;
  unique_traders: number;
};

export type PolymarketMarketOhlcvResponse = {
  pagination?: { page: number; per_page: number; is_last_page: boolean };
  data: PolymarketMarketOhlcvCandle[];
};
