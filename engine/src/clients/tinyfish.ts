import {
  type FetchGetContentsParams,
  type FetchResponse,
  type SearchQueryParams,
  type SearchQueryResponse,
  TinyFish,
} from "@tiny-fish/sdk";

import { logger } from "../logger";

export type TinyFishClientOptions = {
  apiKey: string;
};

export class TinyFishClient {
  private readonly client: TinyFish;

  constructor(options: TinyFishClientOptions) {
    this.client = new TinyFish({ apiKey: options.apiKey });
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
