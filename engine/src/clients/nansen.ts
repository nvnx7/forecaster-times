import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import { logger } from "../logger";
import { polymarketMarketSchema } from "../schema/market";
import type {
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
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
    logger.debug("Nansen market screener request", {
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
}
