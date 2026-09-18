import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import type { EditorialLogger } from "../logger";
import type {
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
} from "../types";

const polymarketMarketSchema = z.object({
  market_id: z.string(),
  question: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
  event_id: z.string().nullable().optional(),
  event_title: z.string().nullable().optional(),
  active: z.boolean().nullable().optional(),
  closed: z.boolean().nullable().optional(),
  end_date: z.string().nullable().optional(),
  neg_risk: z.boolean().nullable().optional(),
  tags: z.array(z.string()).nullable().optional(),
  volume: z.number().nullable().optional(),
  volume_24hr: z.number().nullable().optional(),
  volume_1wk: z.number().nullable().optional(),
  volume_1mo: z.number().nullable().optional(),
  liquidity: z.number().nullable().optional(),
  volume_change_pct: z.number().nullable().optional(),
  open_interest: z.number().nullable().optional(),
  best_bid: z.number().nullable().optional(),
  best_ask: z.number().nullable().optional(),
  last_trade_price: z.number().nullable().optional(),
  one_day_price_change: z.number().nullable().optional(),
  unique_traders_24h: z.number().int().nullable().optional(),
  created_at: z.string().nullable().optional(),
  age_hours: z.number().nullable().optional(),
});

const listPolymarketMarketsResponseSchema = z.object({
  pagination: z
    .object({
      page: z.number().int(),
      per_page: z.number().int(),
      is_last_page: z.boolean(),
    })
    .optional(),
  data: z.array(polymarketMarketSchema),
});

export type NansenClientOptions = {
  apiKey: string;
  baseUrl: string;
  logger: EditorialLogger;
};

/** Server-only client for Nansen's Prediction Market API. */
export class NansenClient {
  private readonly client: AxiosInstance;

  constructor(private readonly options: NansenClientOptions) {
    this.client = axios.create({
      baseURL: options.baseUrl,
      headers: { apikey: options.apiKey, "content-type": "application/json" },
      timeout: 15_000,
    });
  }

  async listPolymarketMarkets(
    params: ListPolymarketMarketsParams = {},
  ): Promise<ListPolymarketMarketsResponse> {
    this.options.logger.debug("Nansen market screener request", {
      status: params.status,
      orderBy: params.orderBy,
      tags: params.tags,
      pagination: params.pagination,
    });

    try {
      const response = await this.client.post<unknown>(
        "/api/v1/prediction-market/market-screener",
        {
          order_by: params.orderBy,
          status: params.status,
          tags: params.tags,
          min_liquidity: params.minLiquidity,
          min_volume_24hr: params.minVolume24hr,
          pagination: params.pagination && {
            page: params.pagination.page,
            per_page: params.pagination.perPage,
          },
        },
      );
      const markets = listPolymarketMarketsResponseSchema.parse(
        response.data,
      ) as ListPolymarketMarketsResponse;

      this.options.logger.info("Nansen market screener response", {
        marketCount: markets.data.length,
        requestId: response.headers["x-request-id"],
      });

      return markets;
    } catch (error) {
      this.options.logger.error("Nansen market screener failed", {
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
