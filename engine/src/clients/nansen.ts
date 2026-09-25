import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import { logger } from "../logger";
import {
  polymarketMarketOhlcvCandleSchema,
  polymarketMarketSchema,
} from "../schema/market";
import type {
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
  PolymarketMarketOhlcvResponse,
} from "../types";
import { getLoggableServiceError } from "../utils";

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

const polymarketMarketOhlcvResponseSchema = z.object({
  pagination: z
    .object({
      page: z.number().int(),
      per_page: z.number().int(),
      is_last_page: z.boolean(),
    })
    .optional(),
  data: z.array(polymarketMarketOhlcvCandleSchema),
});

export type NansenClientOptions = {
  apiKey: string;
  baseUrl: string;
};

/** Server-only client for Nansen's Prediction Market API. */
export class NansenClient {
  private readonly client: AxiosInstance;

  constructor(options: NansenClientOptions) {
    this.client = axios.create({
      baseURL: options.baseUrl,
      headers: { apikey: options.apiKey, "content-type": "application/json" },
      timeout: 15_000,
    });
  }

  async listPolymarketMarkets(
    params: ListPolymarketMarketsParams = {},
  ): Promise<ListPolymarketMarketsResponse> {
    const query = (params.query ?? "").trim().slice(0, 200);

    logger.debug("Nansen market screener request", {
      query,
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
          query,
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

      logger.debug("Nansen market screener response", {
        marketCount: markets.data.length,
        requestId: response.headers["x-request-id"],
      });

      return markets;
    } catch (error) {
      logger.error("Nansen market screener failed", {
        responseBody: getLoggableServiceError(error),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async getPolymarketMarketOhlcv(
    marketId: string,
    from: string,
    to: string,
  ): Promise<PolymarketMarketOhlcvResponse> {
    if (!marketId.trim()) throw new Error("A market ID is required.");

    logger.debug("Nansen market OHLCV request", { marketId, from, to });

    try {
      const response = await this.client.post<unknown>(
        "/api/v1/prediction-market/ohlcv",
        {
          market_id: marketId,
          date: { from, to },
          order_by: [{ field: "period_start", direction: "ASC" }],
          pagination: { page: 1, per_page: 100 },
        },
      );
      const candles = polymarketMarketOhlcvResponseSchema.parse(
        response.data,
      ) as PolymarketMarketOhlcvResponse;

      logger.debug("Nansen market OHLCV response", {
        marketId,
        candleCount: candles.data.length,
        requestId: response.headers["x-request-id"],
      });

      return candles;
    } catch (error) {
      logger.error("Nansen market OHLCV failed", {
        marketId,
        from,
        to,
        responseBody: getLoggableServiceError(error),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
