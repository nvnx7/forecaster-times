import {
  type FetchGetContentsParams,
  type FetchResponse,
  type SearchQueryParams,
  type SearchQueryResponse,
  TinyFish,
} from "@tiny-fish/sdk";

import { logger } from "../logger";
import type { PolymarketMarket, StorySource } from "../types";
import { generateMarketSearchString } from "../utils";

export type TinyFishClientOptions = {
  apiKey: string;
  maxSearchResults?: number;
};

export class TinyFishClient {
  private readonly client: TinyFish;
  private readonly maxSearchResults: number;

  constructor(options: TinyFishClientOptions) {
    this.client = new TinyFish({ apiKey: options.apiKey });
    this.maxSearchResults = options.maxSearchResults || 2;
  }

  async searchMarketNews(
    market: Pick<PolymarketMarket, "created_at" | "event_title" | "question">,
  ): Promise<StorySource[]> {
    if (!market.created_at) {
      throw new Error(
        "A market creation timestamp is required to search related news.",
      );
    }

    const { purpose, query } = generateMarketSearchString(market);
    logger.info("TinyFish market news research started", {
      marketCreatedAt: market.created_at,
      maxSearchResults: this.maxSearchResults,
    });

    const searchResponse = await this.search({
      query,
      language: "en",
      purpose,
      after_date: market.created_at.slice(0, 10),
      domain_type: "news",
      page: 0,
    });
    const selectedResults = searchResponse.results.slice(
      0,
      this.maxSearchResults,
    );
    logger.info("TinyFish market news sources selected", {
      availableResultCount: searchResponse.results.length,
      selectedResultCount: selectedResults.length,
    });

    const fetchResponse = await this.fetch({
      urls: selectedResults.map((result) => result.url),
      purpose,
      format: "markdown",
    });
    logger.info("TinyFish market news research completed", {
      fetchedResultCount: fetchResponse.results.length,
      fetchErrorCount: fetchResponse.errors.length,
    });

    return fetchResponse.results.flatMap((result) => {
      if (result.format !== "markdown" || !result.text) {
        return [];
      }

      return [
        {
          url: result.url,
          final_url: result.final_url,
          title: result.title,
          description: result.description,
          language: result.language,
          format: result.format,
          text: result.text,
          author: result.author,
          published_date: result.published_date,
        } satisfies StorySource,
      ];
    });
  }

  async search(params: SearchQueryParams): Promise<SearchQueryResponse> {
    logger.debug("TinyFish search request", {
      query: params.query,
      domainType: params.domain_type,
      location: params.location,
      language: params.language,
    });

    try {
      const response = await this.client.search.query(params);
      logger.info("TinyFish search response", {
        query: response.query,
        resultCount: response.results.length,
      });
      return response;
    } catch (error) {
      logger.error("TinyFish search failed", {
        query: params.query,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async fetch(params: FetchGetContentsParams): Promise<FetchResponse> {
    logger.debug("TinyFish content fetch request", {
      urlCount: params.urls.length,
      format: params.format,
    });

    try {
      const response = await this.client.fetch.getContents(params);
      logger.info("TinyFish content fetch response", {
        requestedUrlCount: params.urls.length,
        resultCount: response.results.length,
        errorCount: response.errors.length,
      });
      return response;
    } catch (error) {
      logger.error("TinyFish content fetch failed", {
        urlCount: params.urls.length,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
