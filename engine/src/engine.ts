import {
  NansenClient,
  ObjectNotFoundError,
  S3JsonStore,
  type StoredObject,
  TinyFishClient,
  type TinyFishClientOptions,
  TinyFishMarketNewsResearchError,
} from "./clients";
import {
  defaultEditorialEngineConfig,
  type EditorialEngineConfig,
  IMAGE_PRESETS,
} from "./config";
import type { StoryImageGenerator } from "./image-generators";
import { getImagePreset } from "./image-generators";
import { logger } from "./logger";
import { frontPageDraftSchema, frontPageSchema } from "./schema";
import {
  frontPageSecondaryStoryCount,
  rankFrontPageMarketCandidates,
  selectFrontPageBriefMarkets,
} from "./select-front-page-stories";
import type { StoryGenerator } from "./story-generators";
import type {
  Brief,
  FrontPage,
  FrontPageDraft,
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
  PolymarketMarket,
  Story,
  StoryRole,
  StorySource,
} from "./types";
import {
  delay,
  getMarketProbability,
  toMarketBrief,
  toMarketReference,
  withMarketPanel,
} from "./utils";

const defaultFrontPageObjectKey = "editions/front-page/current.json";
const defaultFrontPageDraftObjectKey = "editions/front-page/draft.json";
const frontPageMarketLimit = 10;
const maxSourcesPerStory = 2;

function getFrontPageStoryRole(index: number): StoryRole {
  return index === 0 ? "front-lead" : "front-secondary";
}

function getIllustrationPlacement(role: StoryRole): "wide" | "float-right" {
  return role === "section-lead" ? "float-right" : "wide";
}

function getImageExtension(contentType: string): string {
  switch (contentType.split(";", 1)[0]?.toLowerCase()) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    default:
      throw new Error(
        `Unsupported generated image content type: ${contentType}`,
      );
  }
}

function getFrontPageIllustrationObjectKey(
  editionId: string,
  storyId: string,
  contentType: string,
): string {
  const extension = getImageExtension(contentType);
  return `editions/front-page/${encodeURIComponent(editionId)}/illustrations/${encodeURIComponent(storyId)}.${extension}`;
}

type ResearchedMarket = {
  market: PolymarketMarket;
  sources: StorySource[];
};

function createFrontPage(
  edition: FrontPage["edition"],
  leadStory: Story,
  secondaryStories: Story[],
  briefs: Brief[],
  hotMarkets: PolymarketMarket[],
): FrontPage {
  return {
    pageNumber: 1,
    edition,
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
    frontPageDraftObjectKey?: string;
  };
  tinyFish: TinyFishClientOptions;
  storyGenerator: StoryGenerator;
  storyImageGenerator?: StoryImageGenerator;
  config?: EditorialEngineConfig;
};

export class EditorialEngine {
  private readonly config;
  private readonly frontPageDraftObjectKey;
  private readonly frontPageObjectKey;
  private readonly nansen;
  private readonly store;
  private readonly storyImageGenerator;
  private readonly storyGenerator;
  private readonly tinyFish;

  constructor(options: EditorialEngineOptions) {
    this.config = options.config ?? defaultEditorialEngineConfig;
    this.frontPageDraftObjectKey =
      options.s3.frontPageDraftObjectKey ?? defaultFrontPageDraftObjectKey;
    this.frontPageObjectKey =
      options.s3.frontPageObjectKey ?? defaultFrontPageObjectKey;
    this.nansen = new NansenClient(options.nansen);
    this.store = new S3JsonStore({
      ...options.s3,
      forcePathStyle: options.s3.forcePathStyle ?? true,
    });
    this.tinyFish = new TinyFishClient(options.tinyFish);
    this.storyImageGenerator = options.storyImageGenerator;
    this.storyGenerator = options.storyGenerator;
  }

  get frontPageKey(): string {
    return this.frontPageObjectKey;
  }

  async getFrontPage(): Promise<FrontPage> {
    const document = await this.store.getJson<unknown>(this.frontPageObjectKey);
    return frontPageSchema.parse(document) as FrontPage;
  }

  async getFrontPageIllustration(storyId: string): Promise<StoredObject> {
    const frontPage = await this.getFrontPage();
    const story = [frontPage.leadStory, ...frontPage.secondaryStories].find(
      (candidate) => candidate.id === storyId,
    );
    const asset = story?.illustration?.asset;
    if (!asset) {
      throw new ObjectNotFoundError(`front-page illustration: ${storyId}`);
    }

    return this.store.getObject(asset.objectKey);
  }

  async publishFrontPage(): Promise<FrontPage> {
    const operationId = crypto.randomUUID();
    logger.info("Front-page edition generation started", { operationId });

    try {
      const draft = await this.getOrCreateFrontPageDraft(operationId);
      await this.generateDraftStories(draft, operationId);
      return await this.promoteFrontPageDraft(draft, operationId);
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

  private async getOrCreateFrontPageDraft(
    operationId: string,
  ): Promise<FrontPageDraft> {
    const draft = await this.getFrontPageDraft();
    if (draft && !this.isDraftExpired(draft)) {
      logger.info("Front-page draft resumed", {
        operationId,
        editionId: draft.edition.id,
        completedStoryCount: draft.stories.filter(({ story }) => story).length,
        storyCount: draft.stories.length,
      });
      return draft;
    }

    if (draft) {
      logger.info("Expired front-page draft discarded", {
        operationId,
        editionId: draft.edition.id,
      });
      await this.deleteDraftIllustrations(draft, operationId);
      await this.store.deleteJson(this.frontPageDraftObjectKey);
    }

    return this.createFrontPageDraft(operationId);
  }

  private async getFrontPageDraft(): Promise<FrontPageDraft | undefined> {
    try {
      const document = await this.store.getJson<unknown>(
        this.frontPageDraftObjectKey,
      );
      return frontPageDraftSchema.parse(document) as FrontPageDraft;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) {
        return undefined;
      }
      throw error;
    }
  }

  private isDraftExpired(draft: FrontPageDraft): boolean {
    const createdAt = new Date(draft.createdAt).getTime();
    return Date.now() - createdAt > this.config.editionWindowSeconds * 1_000;
  }

  private async createFrontPageDraft(
    operationId: string,
  ): Promise<FrontPageDraft> {
    const { data: markets } = await this.nansen.listPolymarketMarkets({
      status: "active",
      orderBy: [{ field: "volume_24hr", direction: "DESC" }],
      pagination: { page: 1, perPage: frontPageMarketLimit },
    });
    const marketCandidates = rankFrontPageMarketCandidates(markets);
    const selections = await this.selectFrontPageStoryMarkets(
      marketCandidates,
      operationId,
    );
    if (selections.length === 0) {
      throw new Error(
        "Unable to find a front-page market with usable news sources.",
      );
    }

    const timestamp = new Date().toISOString();
    const draft: FrontPageDraft = {
      version: 1,
      edition: { id: `front-${timestamp}`, now: timestamp },
      marketCandidates,
      briefMarkets: selectFrontPageBriefMarkets(
        marketCandidates,
        selections.map(({ market }) => market),
      ),
      stories: selections.map(({ market, sources }) => ({
        market,
        sources,
        attemptCount: 0,
      })),
      createdAt: timestamp,
      updatedAt: timestamp,
    };

    await this.saveFrontPageDraft(draft);
    logger.info("Front-page draft created", {
      operationId,
      editionId: draft.edition.id,
      leadMarketId: draft.stories[0]?.market.market_id,
      secondaryMarketIds: draft.stories
        .slice(1)
        .map(({ market }) => market.market_id),
    });
    return draft;
  }

  private async generateDraftStories(
    draft: FrontPageDraft,
    operationId: string,
  ): Promise<void> {
    for (const [index, draftStory] of draft.stories.entries()) {
      if (!draftStory.story) {
        await this.generateDraftStory(draft, index, operationId);
      }

      await this.generateDraftIllustration(draft, index, operationId);
    }
  }

  private async generateDraftStory(
    draft: FrontPageDraft,
    index: number,
    operationId: string,
  ): Promise<void> {
    const draftStory = draft.stories[index];
    if (!draftStory) {
      throw new Error(`Draft story ${index} does not exist.`);
    }

    const maximumAttempts = this.config.generationRetryCount + 1;
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        const story = await this.storyGenerator.generateStory(
          draftStory.market,
          draftStory.sources,
        );
        draftStory.story = story;
        draftStory.attemptCount += 1;
        delete draftStory.lastError;
        await this.saveFrontPageDraft(draft);
        return;
      } catch (error) {
        draftStory.attemptCount += 1;
        draftStory.lastError =
          error instanceof Error ? error.message : "Unknown error";
        await this.saveFrontPageDraft(draft);

        if (attempt === maximumAttempts) {
          throw error;
        }

        logger.warn("Front-page story generation retry scheduled", {
          operationId,
          marketId: draftStory.market.market_id,
          attempt,
          maximumAttempts,
          message: draftStory.lastError,
        });
        await delay(this.config.generationRetryBaseDelayMs * attempt);
      }
    }
  }

  private async saveFrontPageDraft(draft: FrontPageDraft): Promise<void> {
    draft.updatedAt = new Date().toISOString();
    const document = frontPageDraftSchema.parse(draft) as FrontPageDraft;
    await this.store.putJson(this.frontPageDraftObjectKey, document);
  }

  private async deleteDraftIllustrations(
    draft: FrontPageDraft,
    operationId: string,
  ): Promise<void> {
    for (const draftStory of draft.stories) {
      const asset = draftStory.story?.illustration?.asset;
      if (!asset) {
        continue;
      }

      try {
        await this.store.deleteObject(asset.objectKey);
      } catch (error) {
        logger.warn("Expired front-page illustration cleanup failed", {
          operationId,
          editionId: draft.edition.id,
          objectKey: asset.objectKey,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  private async generateDraftIllustration(
    draft: FrontPageDraft,
    index: number,
    operationId: string,
  ): Promise<void> {
    const draftStory = draft.stories[index];
    const story = draftStory?.story;
    if (!draftStory || !story || !this.storyImageGenerator) {
      return;
    }

    const role = getFrontPageStoryRole(index);
    const preset = getImagePreset(role, story.section);
    if (!preset || story.illustration) {
      return;
    }

    const maximumAttempts = this.config.generationRetryCount + 1;
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        const image = await this.storyImageGenerator.generateStoryImage({
          story,
          role,
          preset,
        });
        const objectKey = getFrontPageIllustrationObjectKey(
          draft.edition.id,
          story.id,
          image.contentType,
        );
        await this.store.putObject(objectKey, image.bytes, image.contentType);
        story.illustration = {
          src: `/api/front/illustrations/${encodeURIComponent(story.id)}`,
          alt: image.alt,
          placement: getIllustrationPlacement(role),
          aspectRatio: IMAGE_PRESETS[preset].aspectRatio,
          asset: {
            objectKey,
            contentType: image.contentType,
            preset,
          },
        };
        draftStory.illustrationAttemptCount =
          (draftStory.illustrationAttemptCount ?? 0) + 1;
        delete draftStory.illustrationLastError;
        await this.saveFrontPageDraft(draft);
        return;
      } catch (error) {
        draftStory.illustrationAttemptCount =
          (draftStory.illustrationAttemptCount ?? 0) + 1;
        draftStory.illustrationLastError =
          error instanceof Error ? error.message : "Unknown error";
        await this.saveFrontPageDraft(draft);

        if (attempt === maximumAttempts) {
          throw error;
        }

        logger.warn("Front-page illustration generation retry scheduled", {
          operationId,
          marketId: draftStory.market.market_id,
          attempt,
          maximumAttempts,
          message: draftStory.illustrationLastError,
        });
        await delay(this.config.generationRetryBaseDelayMs * attempt);
      }
    }
  }

  private async promoteFrontPageDraft(
    draft: FrontPageDraft,
    operationId: string,
  ): Promise<FrontPage> {
    const [leadDraftStory, ...secondaryDraftStories] = draft.stories;
    if (!leadDraftStory?.story) {
      throw new Error("Front-page draft is missing its lead story.");
    }
    const secondaryStories = secondaryDraftStories.map((draftStory) => {
      if (!draftStory.story) {
        throw new Error("Front-page draft has an unfinished secondary story.");
      }
      return withMarketPanel(draftStory.story, draftStory.market);
    });
    const frontPage = frontPageSchema.parse(
      createFrontPage(
        draft.edition,
        withMarketPanel(leadDraftStory.story, leadDraftStory.market),
        secondaryStories,
        draft.briefMarkets.map(toMarketBrief),
        draft.marketCandidates,
      ),
    ) as FrontPage;

    await this.store.putJson(this.frontPageObjectKey, frontPage);
    try {
      await this.store.deleteJson(this.frontPageDraftObjectKey);
    } catch (error) {
      logger.warn("Front-page draft cleanup failed", {
        operationId,
        editionId: draft.edition.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }

    logger.info("Front-page edition generation completed", {
      operationId,
      editionId: frontPage.edition.id,
      objectKey: this.frontPageObjectKey,
    });
    return frontPage;
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
      const sources = await this.tinyFish.searchMarketNews(market);
      return sources.slice(0, maxSourcesPerStory);
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
}

export function createEditorialEngine(
  options: EditorialEngineOptions,
): EditorialEngine {
  return new EditorialEngine(options);
}

export { ObjectNotFoundError };
