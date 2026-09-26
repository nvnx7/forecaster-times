import {
  type FetchGetContentsParams,
  type FetchResponse,
  type SearchQueryParams,
  type SearchQueryResponse,
  TinyFish,
} from "@tiny-fish/sdk";
import { logger } from "../logger";
import type { PolymarketMarket, StorySource } from "../types";
import { generateMarketSearchString, getLoggableServiceError } from "../utils";

export type TinyFishClientOptions = {
  apiKey: string;
  minSearchResults?: number;
};

type MarketNewsResearch = {
  fetchErrors: { url: string; error: string }[];
  sources: StorySource[];
};

const excludedNewsPaths = ["/watch", "/stream", "/live", "/video"];

function isExcludedNewsUrl(url: string): boolean {
  try {
    const { pathname } = new URL(url);
    return excludedNewsPaths.some(
      (path) => pathname === path || pathname.startsWith(`${path}/`),
    );
  } catch {
    return false;
  }
}

export class TinyFishMarketNewsResearchError extends Error {
  constructor(
    marketQuestion: string | null | undefined,
    fetchErrors: ReadonlyArray<{ url: string; error: string }>,
  ) {
    const errorDetails = fetchErrors
      .map(({ error, url }) => `${url}: ${error}`)
      .join("; ");

    super(
      `TinyFish could not fetch usable news content for market "${marketQuestion ?? "unknown market"}"${
        errorDetails ? `: ${errorDetails}` : "."
      }`,
    );
    this.name = "TinyFishMarketNewsResearchError";
  }
}

export class TinyFishClient {
  private readonly client: TinyFish;
  private readonly minSearchResults: number;

  constructor(options: TinyFishClientOptions) {
    this.client = new TinyFish({ apiKey: options.apiKey });
    this.minSearchResults = options.minSearchResults || 2;
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
    logger.debug("TinyFish market news research started", {
      marketCreatedAt: market.created_at,
      minSearchResults: this.minSearchResults,
    });

    const research = await this.findMarketNewsSources({
      query,
      language: "en",
      purpose,
      after_date: market.created_at.slice(0, 10),
      domain_type: "news",
    });

    if (research.sources.length === 0) {
      const error = new TinyFishMarketNewsResearchError(
        market.question,
        research.fetchErrors,
      );
      logger.error("TinyFish market news research failed", {
        query,
        marketQuestion: market.question,
        fetchErrors: research.fetchErrors,
        message: error.message,
      });
      throw error;
    }

    return research.sources;
  }

  private async findMarketNewsSources(
    params: Omit<SearchQueryParams, "page">,
  ): Promise<MarketNewsResearch> {
    const sources: StorySource[] = [];
    const fetchErrors: { url: string; error: string }[] = [];
    let page = 0;

    while (sources.length < this.minSearchResults) {
      const searchResponse = await this.search({ ...params, page });
      if (searchResponse.results.length === 0) {
        break;
      }

      const results = searchResponse.results.filter(
        (result) => !isExcludedNewsUrl(result.url),
      );

      logger.debug("TinyFish market news sources selected", {
        page: searchResponse.page,
        availableResultCount: searchResponse.results.length,
        excludedResultCount: searchResponse.results.length - results.length,
        usableSourceCount: sources.length,
      });

      if (results.length > 0) {
        const fetchResponse = await this.fetch({
          urls: results.map((result) => result.url),
          purpose: params.purpose,
          format: "markdown",
        });
        fetchErrors.push(...fetchResponse.errors);
        sources.push(...this.toStorySources(fetchResponse));

        logger.debug("TinyFish market news research page completed", {
          page: searchResponse.page,
          fetchedResultCount: fetchResponse.results.length,
          fetchErrorCount: fetchResponse.errors.length,
          usableSourceCount: sources.length,
        });
      }

      const lastResultPosition = Math.max(
        ...searchResponse.results.map((result) => result.position),
      );
      if (lastResultPosition >= searchResponse.total_results) {
        break;
      }

      page = searchResponse.page + 1;
    }

    logger.debug("TinyFish market news research completed", {
      usableSourceCount: sources.length,
      fetchErrorCount: fetchErrors.length,
      minSearchResults: this.minSearchResults,
    });

    return { sources, fetchErrors };
  }

  private toStorySources(response: FetchResponse): StorySource[] {
    return response.results.flatMap((result) => {
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
      logger.debug("TinyFish search response", {
        query: response.query,
        resultCount: response.results.length,
      });
      return response;
    } catch (error) {
      logger.error("TinyFish search failed", {
        query: params.query,
        responseBody: getLoggableServiceError(error),
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
      logger.debug("TinyFish content fetch response", {
        requestedUrlCount: params.urls.length,
        resultCount: response.results.length,
        errorCount: response.errors.length,
        errors: response.errors,
      });
      return response;
    } catch (error) {
      logger.error("TinyFish content fetch failed", {
        urlCount: params.urls.length,
        responseBody: getLoggableServiceError(error),
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }
}
