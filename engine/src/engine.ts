import {
  NansenClient,
  ObjectNotFoundError,
  S3JsonStore,
  TinyFishClient,
  type TinyFishClientOptions,
} from "./clients";
import { logger } from "./logger";
import { frontPageSchema } from "./schema";
import { extractFrontPageStories } from "./select-front-page-stories";
import type { StoryGenerator } from "./story-generators";
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
      id: `front-${timestamp}`,
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

export type EditorialEngineOptions = {
  nansen: { apiKey: string; baseUrl: string };
  s3: {
    endpoint: string;
    accessKeyId: string;
    secretAccessKey: string;
    region: string;
    bucketName: string;
    forcePathStyle?: boolean;
    frontPageObjectKey?: string;
  };
  tinyFish: TinyFishClientOptions;
  storyGenerator: StoryGenerator;
};

export class EditorialEngine {
  private readonly logger;
  private readonly frontPageObjectKey;
  private readonly nansen;
  private readonly store;
  private readonly storyGenerator;
  private readonly tinyFish;

  constructor(options: EditorialEngineOptions) {
    this.logger = logger;
    this.frontPageObjectKey =
      options.s3.frontPageObjectKey ?? defaultFrontPageObjectKey;
    this.nansen = new NansenClient(options.nansen);
    this.store = new S3JsonStore({
      ...options.s3,
      forcePathStyle: options.s3.forcePathStyle ?? true,
    });
    this.tinyFish = new TinyFishClient(options.tinyFish);
    this.storyGenerator = options.storyGenerator;
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
      // Fetch list of top markets by 24H volume
      const { data: markets } = await this.nansen.listPolymarketMarkets({
        status: "active",
        orderBy: [{ field: "volume_24hr", direction: "DESC" }],
        pagination: { page: 1, perPage: frontPageMarketLimit },
      });

      // Select and extract stories for front page
      const frontPageStories = extractFrontPageStories(markets);
      if (!frontPageStories.leadMarket) {
        throw new Error(
          "Nansen returned no active markets for the front page.",
        );
      }

      this.logger.info("Front-page markets selected", {
        operationId,
        leadMarketId: frontPageStories.leadMarket.market_id,
        secondaryMarketIds: frontPageStories.secondaryMarkets.map(
          (market) => market.market_id,
        ),
        briefMarketIds: frontPageStories.briefMarkets.map(
          (market) => market.market_id,
        ),
      });

      // For selected stories fetch news around it using TinyFish
      const selectedStoryMarkets = [
        frontPageStories.leadMarket,
        ...frontPageStories.secondaryMarkets,
      ];
      const marketNewsData = await Promise.all(
        selectedStoryMarkets.map((market) =>
          this.tinyFish.searchMarketNews(market),
        ),
      );

      const generatedStories = await Promise.all(
        selectedStoryMarkets.map((market, index) =>
          this.storyGenerator.generateStory(
            market,
            marketNewsData[index] ?? [],
          ),
        ),
      );
      const [leadStory, ...secondaryGeneratedStories] = generatedStories;
      if (!leadStory)
        throw new Error("Unable to generate the selected lead story.");

      const secondaryStories = frontPageStories.secondaryMarkets.map(
        (market, index) => {
          const story = secondaryGeneratedStories[index];
          if (!story)
            throw new Error("Unable to generate a selected secondary story.");
          return withMarketPanel(story, market);
        },
      );

      const frontPage = frontPageSchema.parse(
        createFrontPage(
          withMarketPanel(leadStory, frontPageStories.leadMarket),
          secondaryStories,
          frontPageStories.briefMarkets.map(toMarketBrief),
          frontPageStories.hotMarkets,
        ),
      ) as FrontPage;

      // Save front page data to storage
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
