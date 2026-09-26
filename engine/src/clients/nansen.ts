import axios, { type AxiosInstance } from "axios";
import { z } from "zod";

import { logger } from "../logger";
import { polymarketMarketSchema } from "../schema/market";
import type {
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
} from "../types";
import { getLoggableServiceError, isActiveMarket } from "../utils";

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

function normalizeMarketScreenerQuery(value?: string) {
  return (value ?? "")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "")
    .replace(/≥/g, " at least ")
    .replace(/≤/g, " at most ")
    .replace(/>/g, " greater than ")
    .replace(/</g, " less than ")
    .replace(/\+/g, " plus ")
    .replace(/%/g, " percent ")
    .replace(/\$/g, " dollars ")
    .replace(/[^a-zA-Z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 200);
}

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
    const query = normalizeMarketScreenerQuery(params.query);

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
      const parsed = listPolymarketMarketsResponseSchema.parse(
        response.data,
      ) as ListPolymarketMarketsResponse;
      const data =
        params.status === "active"
          ? parsed.data.filter(isActiveMarket)
          : parsed.data;

      logger.debug("Nansen market screener response", {
        marketCount: data.length,
        excludedMarketCount: parsed.data.length - data.length,
        requestId: response.headers["x-request-id"],
      });

      return { data, pagination: parsed.pagination };
    } catch (error) {
      logger.error("Nansen market screener failed", {
        responseBody: getLoggableServiceError(error),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
