import {
  NansenClient,
  ObjectNotFoundError,
  S3JsonStore,
  TinyFishClient,
  type TinyFishClientOptions,
  TinyFishMarketNewsResearchError,
} from "./clients";
import { logger } from "./logger";
import { frontPageSchema } from "./schema";
import {
  frontPageSecondaryStoryCount,
  rankFrontPageMarketCandidates,
  selectFrontPageBriefMarkets,
} from "./select-front-page-stories";
import type { StoryGenerator } from "./story-generators";
import type {
  Brief,
  FrontPage,
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
  PolymarketMarket,
  Story,
  StorySource,
} from "./types";
import {
  getMarketProbability,
  toMarketBrief,
  toMarketReference,
  withMarketPanel,
} from "./utils";

const defaultFrontPageObjectKey = "editions/front-page/current.json";
const frontPageMarketLimit = 10;

type ResearchedMarket = {
  market: PolymarketMarket;
  sources: StorySource[];
};

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
  private readonly frontPageObjectKey;
  private readonly nansen;
  private readonly store;
  private readonly storyGenerator;
  private readonly tinyFish;

  constructor(options: EditorialEngineOptions) {
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
    logger.info("Front-page edition generation started", { operationId });

    try {
      // Fetch list of top markets by 24H volume
      const { data: markets } = await this.nansen.listPolymarketMarkets({
        status: "active",
        orderBy: [{ field: "volume_24hr", direction: "DESC" }],
        pagination: { page: 1, perPage: frontPageMarketLimit },
      });

      const marketCandidates = rankFrontPageMarketCandidates(markets);
      const selectedStoryMarkets = await this.selectFrontPageStoryMarkets(
        marketCandidates,
        operationId,
      );
      const [leadMarket, ...secondaryStoryMarkets] = selectedStoryMarkets;
      if (!leadMarket) {
        throw new Error(
          "Unable to find a front-page market with usable news sources.",
        );
      }
      const briefMarkets = selectFrontPageBriefMarkets(
        marketCandidates,
        selectedStoryMarkets.map(({ market }) => market),
      );

      logger.info("Front-page markets selected", {
        operationId,
        leadMarketId: leadMarket.market.market_id,
        secondaryMarketIds: secondaryStoryMarkets.map(
          ({ market }) => market.market_id,
        ),
        briefMarketIds: briefMarkets.map((market) => market.market_id),
      });

      const generatedStories = await this.generateStories(selectedStoryMarkets);
      const [leadStory, ...secondaryGeneratedStories] = generatedStories;
      if (!leadStory)
        throw new Error("Unable to generate the selected lead story.");

      const secondaryStories = secondaryStoryMarkets.map((selection, index) => {
        const story = secondaryGeneratedStories[index];
        if (!story)
          throw new Error("Unable to generate a selected secondary story.");
        return withMarketPanel(story, selection.market);
      });

      const frontPage = frontPageSchema.parse(
        createFrontPage(
          withMarketPanel(leadStory, leadMarket.market),
          secondaryStories,
          briefMarkets.map(toMarketBrief),
          marketCandidates,
        ),
      ) as FrontPage;

      // Save front page data to storage
      await this.store.putJson(this.frontPageObjectKey, frontPage);
      logger.info("Front-page edition generation completed", {
        operationId,
        editionId: frontPage.edition.id,
        objectKey: this.frontPageObjectKey,
      });

      return frontPage;
    } catch (error) {
      logger.error("Front-page edition generation failed", {
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

  private async selectFrontPageStoryMarkets(
    candidates: PolymarketMarket[],
    operationId: string,
  ): Promise<ResearchedMarket[]> {
    const selections: ResearchedMarket[] = [];
    const requiredStoryCount = frontPageSecondaryStoryCount + 1;

    for (const market of candidates) {
      if (selections.length === requiredStoryCount) {
        break;
      }

      const sources = await this.tryGetMarketNews(market, operationId);
      if (!sources) {
        continue;
      }

      selections.push({ market, sources });
    }

    return selections;
  }

  private async tryGetMarketNews(
    market: PolymarketMarket,
    operationId: string,
  ): Promise<StorySource[] | undefined> {
    try {
      return await this.tinyFish.searchMarketNews(market);
    } catch (error) {
      if (!(error instanceof TinyFishMarketNewsResearchError)) {
        throw error;
      }

      logger.warn("Front-page market skipped after news research", {
        operationId,
        marketId: market.market_id,
        message: error.message,
      });
      return undefined;
    }
  }

  private async generateStories(
    selections: ResearchedMarket[],
  ): Promise<Story[]> {
    const stories: Story[] = [];

    for (const { market, sources } of selections) {
      stories.push(await this.storyGenerator.generateStory(market, sources));
    }

    return stories;
  }
}

export function createEditorialEngine(
  options: EditorialEngineOptions,
): EditorialEngine {
  return new EditorialEngine(options);
}

export { ObjectNotFoundError };
