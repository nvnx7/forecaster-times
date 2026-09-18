import { NansenClient, ObjectNotFoundError, S3JsonStore } from "./clients";
import type { EditorialEngineOptions } from "./config";
import { defaultEditorialConfig } from "./config";
import { createEditorialLogger } from "./logger";
import { frontPageSchema } from "./schema";
import { selectFrontPageStories } from "./select-front-page-stories";
import { GeminiStoryGenerator } from "./story-generators";
import type {
  Brief,
  FrontPage,
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
  PolymarketMarket,
  Story,
} from "./types";
import {
  getMarketProbability,
  toMarketBrief,
  toMarketReference,
  withMarketPanel,
} from "./utils";

const defaultFrontPageObjectKey = "editions/front-page/current.json";
const frontPageMarketLimit = 6;

function createFrontPage(
  leadStory: Story,
  secondaryStories: Story[],
  briefs: Brief[],
  hotMarkets: PolymarketMarket[],
): FrontPage {
  const now = new Date();
  const timestamp = now.toISOString();
  return {
    pageNumber: 1,
    edition: {
      id: `front-page-${timestamp}`,
      now: timestamp,
    },
    leadStory,
    secondaryStories,
    briefs,
    hotMarkets: hotMarkets.map((market) => ({
      market: toMarketReference(market),
      probability: getMarketProbability(market),
      change24h: market.one_day_price_change ?? undefined,
    })),
  };
}

/**
 * The server-side entry point for reading and publishing complete editions.
 * It deliberately exposes page-level operations rather than infrastructure.
 */
export class EditorialEngine {
  private readonly logger;
  private readonly frontPageObjectKey;
  private readonly nansen;
  private readonly store;
  private readonly storyGenerator;

  constructor(options: EditorialEngineOptions) {
    const logger = options.logger ?? createEditorialLogger();
    const config = options.editorial ?? defaultEditorialConfig;
    this.logger = logger;
    this.frontPageObjectKey =
      options.s3.frontPageObjectKey ?? defaultFrontPageObjectKey;
    this.nansen = new NansenClient({ ...options.nansen, logger });
    this.store = new S3JsonStore({
      ...options.s3,
      forcePathStyle: options.s3.forcePathStyle ?? true,
      logger,
    });
    this.storyGenerator = new GeminiStoryGenerator({
      ...options.gemini,
      config,
      logger,
    });
  }

  get frontPageKey(): string {
    return this.frontPageObjectKey;
  }

  async getFrontPage(): Promise<FrontPage> {
    const document = await this.store.getJson<unknown>(this.frontPageObjectKey);
    return frontPageSchema.parse(document) as FrontPage;
  }

  async publishFrontPage(): Promise<FrontPage> {
    const operationId = crypto.randomUUID();
    this.logger.info("Front-page edition generation started", { operationId });

    try {
      const { data: markets } = await this.nansen.listPolymarketMarkets({
        status: "active",
        orderBy: [{ field: "volume_24hr", direction: "DESC" }],
        pagination: { page: 1, perPage: frontPageMarketLimit },
      });
      const selection = selectFrontPageStories(markets);
      if (!selection.leadMarket) {
        throw new Error(
          "Nansen returned no active markets for the front page.",
        );
      }

      this.logger.info("Front-page markets selected", {
        operationId,
        leadMarketId: selection.leadMarket.market_id,
        secondaryMarketIds: selection.secondaryMarkets.map(
          (market) => market.market_id,
        ),
        briefMarketIds: selection.briefMarkets.map(
          (market) => market.market_id,
        ),
      });

      const generatedStories = await Promise.all(
        [selection.leadMarket, ...selection.secondaryMarkets].map((market) =>
          this.storyGenerator.generateStory(market),
        ),
      );
      const [leadStory, ...secondaryGeneratedStories] = generatedStories;
      if (!leadStory)
        throw new Error("Unable to generate the selected lead story.");

      const secondaryStories = selection.secondaryMarkets.map(
        (market, index) => {
          const story = secondaryGeneratedStories[index];
          if (!story)
            throw new Error("Unable to generate a selected secondary story.");
          return withMarketPanel(story, market);
        },
      );
      const frontPage = frontPageSchema.parse(
        createFrontPage(
          withMarketPanel(leadStory, selection.leadMarket),
          secondaryStories,
          selection.briefMarkets.map(toMarketBrief),
          selection.hotMarkets,
        ),
      ) as FrontPage;

      await this.store.putJson(this.frontPageObjectKey, frontPage);
      this.logger.info("Front-page edition generation completed", {
        operationId,
        editionId: frontPage.edition.id,
        objectKey: this.frontPageObjectKey,
      });
      return frontPage;
    } catch (error) {
      this.logger.error("Front-page edition generation failed", {
        operationId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async listPolymarketMarkets(
    params: ListPolymarketMarketsParams = {},
  ): Promise<ListPolymarketMarketsResponse> {
    return this.nansen.listPolymarketMarkets(params);
  }
}

export function createEditorialEngine(
  options: EditorialEngineOptions,
): EditorialEngine {
  return new EditorialEngine(options);
}

export { ObjectNotFoundError };
