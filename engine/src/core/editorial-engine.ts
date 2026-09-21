import {
  NansenClient,
  ObjectNotFoundError,
  S3JsonStore,
  type StoredObject,
  TinyFishClient,
  type TinyFishClientOptions,
  TinyFishMarketNewsResearchError,
} from "../clients";
import {
  type CategoryPageConfig,
  defaultEditorialEngineConfig,
  type EditorialEngineConfig,
  imagePresets,
  type PageConfig,
  pageConfigs,
} from "../config";
import { getImagePreset, type StoryImageGenerator } from "../image-generators";
import { logger } from "../logger";
import {
  categoryPageSchema,
  frontPageSchema,
  pageDraftSchema,
} from "../schema";
import type { StoryGenerator } from "../story-generators";
import type {
  CategoryBrief,
  CategoryPage,
  CategoryPageId,
  CategorySidebar,
  FrontPage,
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
  PageDraft,
  PolymarketMarket,
  Story,
  StoryRole,
  StorySource,
} from "../types";
import {
  delay,
  getImageExtension,
  getMarketProbability,
  toMarketBrief,
  toMarketPanel,
  toMarketReference,
  withMarketPanel,
} from "../utils";

const maxSourcesPerStory = 2;

type Page = FrontPage | CategoryPage;
type PageKeys = { current: string; draft: string };
type ResearchedMarket = { market: PolymarketMarket; sources: StorySource[] };

function toCategoryBrief(
  market: PolymarketMarket,
  category: CategoryBrief["category"],
): CategoryBrief {
  const probability = getMarketProbability(market);
  return {
    id: `brief-${market.market_id}`,
    category,
    kicker: market.event_title ?? undefined,
    headline: market.question ?? "Untitled prediction market",
    summary: `Traders currently price this outcome at ${Math.round(probability * 100)}%.`,
    probability,
    change24h: market.one_day_price_change ?? undefined,
    market: toMarketReference(market),
  };
}

function createSidebar(
  config: CategoryPageConfig,
  markets: PolymarketMarket[],
): CategorySidebar {
  const items = markets.slice(0, config.briefCount).map((market) => {
    const probability = getMarketProbability(market);
    const change = market.one_day_price_change ?? 0;
    return {
      id: market.market_id,
      label: market.question ?? "Untitled prediction market",
      probability,
      change24h: change,
      previousProbability: probability - change,
      change,
    };
  });

  if (config.sidebar.type === "changes") {
    return {
      type: "changes",
      title: config.sidebar.title,
      items: items.map(({ change24h: _change24h, ...item }) => item),
    };
  }
  if (config.sidebar.type === "movers") {
    return {
      type: "movers",
      title: config.sidebar.title,
      items: items.map(
        ({
          previousProbability: _previousProbability,
          change: _change,
          ...item
        }) => item,
      ),
    };
  }
  return {
    type: "odds",
    title: config.sidebar.title,
    items: items.map(
      ({
        previousProbability: _previousProbability,
        change24h: _change24h,
        change: _change,
        ...item
      }) => item,
    ),
  };
}

function getStoryRole(config: PageConfig, index: number): StoryRole {
  if (config.kind === "front") {
    return index === 0 ? "front-lead" : "front-secondary";
  }
  return index === 0 ? "category-lead" : "category-secondary";
}

function getIllustrationObjectKey(
  pageId: CategoryPageId,
  editionId: string,
  storyId: string,
  contentType: string,
): string {
  const root =
    pageId === "front"
      ? "editions/front-page"
      : `editions/categories/${pageId}`;
  return `${root}/${encodeURIComponent(editionId)}/illustrations/${encodeURIComponent(storyId)}.${getImageExtension(contentType)}`;
}

function getIllustrationSource(
  pageId: CategoryPageId,
  storyId: string,
): string {
  const encodedStoryId = encodeURIComponent(storyId);
  return pageId === "front"
    ? `/api/front/illustrations/${encodedStoryId}`
    : `/api/categories/${pageId}/illustrations/${encodedStoryId}`;
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

/** Generates and serves every editorial page through one resumable pipeline. */
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
      options.s3.frontPageDraftObjectKey ?? "editions/front-page/draft.json";
    this.frontPageObjectKey =
      options.s3.frontPageObjectKey ?? "editions/front-page/current.json";
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
    return this.getPageKeys("front").current;
  }

  async getPage(pageId: CategoryPageId): Promise<Page> {
    const document = await this.store.getJson<unknown>(
      this.getPageKeys(pageId).current,
    );
    return pageId === "front"
      ? (frontPageSchema.parse(document) as FrontPage)
      : (categoryPageSchema.parse(document) as CategoryPage);
  }

  async getFrontPage(): Promise<FrontPage> {
    return (await this.getPage("front")) as FrontPage;
  }

  async getCategoryPage(categoryId: CategoryPageId): Promise<CategoryPage> {
    this.getCategoryConfig(categoryId);
    return (await this.getPage(categoryId)) as CategoryPage;
  }

  async getStory(pageId: CategoryPageId, storyId: string): Promise<Story> {
    const page = await this.getPage(pageId);
    const story = [page.leadStory, ...page.secondaryStories].find(
      (candidate) => candidate.id === storyId,
    );
    if (!story) {
      throw new ObjectNotFoundError(`${pageId} story: ${storyId}`);
    }
    return story;
  }

  async getIllustration(
    pageId: CategoryPageId,
    storyId: string,
  ): Promise<StoredObject> {
    const asset = (await this.getStory(pageId, storyId)).illustration?.asset;
    if (!asset) {
      throw new ObjectNotFoundError(`${pageId} illustration: ${storyId}`);
    }
    return this.store.getObject(asset.objectKey);
  }

  async getFrontPageIllustration(storyId: string): Promise<StoredObject> {
    return this.getIllustration("front", storyId);
  }

  async getCategoryPageIllustration(
    categoryId: CategoryPageId,
    storyId: string,
  ): Promise<StoredObject> {
    this.getCategoryConfig(categoryId);
    return this.getIllustration(categoryId, storyId);
  }

  async publishPage(pageId: CategoryPageId): Promise<Page> {
    const operationId = crypto.randomUUID();
    logger.info("Editorial page generation started", { operationId, pageId });
    try {
      const draft = await this.getOrCreateDraft(pageId, operationId);
      await this.generateDraftStories(pageId, draft, operationId);
      return await this.promoteDraft(pageId, draft, operationId);
    } catch (error) {
      logger.error("Editorial page generation failed", {
        operationId,
        pageId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async publishFrontPage(): Promise<FrontPage> {
    return (await this.publishPage("front")) as FrontPage;
  }

  async publishCategoryPage(categoryId: CategoryPageId): Promise<CategoryPage> {
    this.getCategoryConfig(categoryId);
    return (await this.publishPage(categoryId)) as CategoryPage;
  }

  async listPolymarketMarkets(
    params: ListPolymarketMarketsParams = {},
  ): Promise<ListPolymarketMarketsResponse> {
    return this.nansen.listPolymarketMarkets(params);
  }

  private getPageConfig(pageId: CategoryPageId): PageConfig {
    return pageConfigs[pageId];
  }

  private getCategoryConfig(pageId: CategoryPageId): CategoryPageConfig {
    const config = this.getPageConfig(pageId);
    if (config.kind !== "category") {
      throw new Error("The front page is not a category page.");
    }
    return config;
  }

  private getPageKeys(pageId: CategoryPageId): PageKeys {
    if (pageId === "front") {
      return {
        current: this.frontPageObjectKey,
        draft: this.frontPageDraftObjectKey,
      };
    }
    const root = `editions/categories/${pageId}`;
    return { current: `${root}/current.json`, draft: `${root}/draft.json` };
  }

  private async getOrCreateDraft(
    pageId: CategoryPageId,
    operationId: string,
  ): Promise<PageDraft> {
    const draft = await this.getDraft(pageId);
    if (draft && !this.isDraftExpired(draft)) {
      logger.info("Editorial page draft resumed", {
        operationId,
        pageId,
        editionId: draft.edition.id,
        completedStoryCount: draft.stories.filter(({ story }) => story).length,
        storyCount: draft.stories.length,
      });
      return draft;
    }
    if (draft) {
      await this.deleteDraftIllustrations(pageId, draft, operationId);
      await this.store.deleteJson(this.getPageKeys(pageId).draft);
    }
    return this.createDraft(pageId, operationId);
  }

  private async getDraft(
    pageId: CategoryPageId,
  ): Promise<PageDraft | undefined> {
    try {
      const document = await this.store.getJson<unknown>(
        this.getPageKeys(pageId).draft,
      );
      return pageDraftSchema.parse(document) as PageDraft;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
  }

  private isDraftExpired(draft: PageDraft): boolean {
    return (
      Date.now() - new Date(draft.createdAt).getTime() >
      this.config.editionWindowSeconds * 1_000
    );
  }

  private async createDraft(
    pageId: CategoryPageId,
    operationId: string,
  ): Promise<PageDraft> {
    const config = this.getPageConfig(pageId);
    const { data } = await this.nansen.listPolymarketMarkets({
      status: "active",
      tags: config.kind === "category" ? config.nansenTags : undefined,
      orderBy: [{ field: "volume_24hr", direction: "DESC" }],
      pagination: { page: 1, perPage: config.candidateLimit },
    });
    const marketCandidates = [...data].sort(
      (first, second) => (second.volume_24hr ?? 0) - (first.volume_24hr ?? 0),
    );
    const selections = await this.selectStoryMarkets(
      pageId,
      marketCandidates,
      config.storyCount,
      operationId,
    );
    if (selections.length === 0) {
      throw new Error(`No researched markets available for ${pageId}.`);
    }

    const now = new Date().toISOString();
    const selectedIds = new Set(
      selections.map(({ market }) => market.market_id),
    );
    const draft: PageDraft = {
      version: 1,
      edition: { id: `${pageId}-${now}`, now },
      marketCandidates,
      briefMarkets: marketCandidates
        .filter((market) => !selectedIds.has(market.market_id))
        .slice(0, config.briefCount),
      stories: selections.map(({ market, sources }) => ({
        market,
        sources,
        attemptCount: 0,
      })),
      createdAt: now,
      updatedAt: now,
    };
    await this.saveDraft(pageId, draft);
    logger.info("Editorial page draft created", {
      operationId,
      pageId,
      editionId: draft.edition.id,
      leadMarketId: draft.stories[0]?.market.market_id,
      secondaryMarketIds: draft.stories
        .slice(1)
        .map(({ market }) => market.market_id),
    });
    return draft;
  }

  private async selectStoryMarkets(
    pageId: CategoryPageId,
    candidates: PolymarketMarket[],
    storyCount: number,
    operationId: string,
  ): Promise<ResearchedMarket[]> {
    const selections: ResearchedMarket[] = [];
    for (const market of candidates) {
      if (selections.length === storyCount) break;
      try {
        const sources = await this.tinyFish.searchMarketNews(market);
        if (sources.length > 0) {
          selections.push({
            market,
            sources: sources.slice(0, maxSourcesPerStory),
          });
        }
      } catch (error) {
        if (!(error instanceof TinyFishMarketNewsResearchError)) throw error;
        logger.warn("Editorial page market skipped after news research", {
          operationId,
          pageId,
          marketId: market.market_id,
          message: error.message,
        });
      }
    }
    return selections;
  }

  private async generateDraftStories(
    pageId: CategoryPageId,
    draft: PageDraft,
    operationId: string,
  ): Promise<void> {
    for (const [index, slot] of draft.stories.entries()) {
      if (!slot.story)
        await this.generateDraftStory(pageId, draft, index, operationId);
      await this.generateDraftIllustration(pageId, draft, index, operationId);
    }
  }

  private async generateDraftStory(
    pageId: CategoryPageId,
    draft: PageDraft,
    index: number,
    operationId: string,
  ): Promise<void> {
    const slot = draft.stories[index];
    if (!slot) throw new Error(`Draft story ${index} does not exist.`);
    const maximumAttempts = this.config.generationRetryCount + 1;
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        const generated = await this.storyGenerator.generateStory(
          slot.market,
          slot.sources,
        );
        const config = this.getPageConfig(pageId);
        slot.story =
          config.kind === "category"
            ? {
                ...generated,
                category: config.storyCategory,
                market: toMarketPanel(slot.market),
              }
            : generated;
        slot.attemptCount += 1;
        delete slot.lastError;
        await this.saveDraft(pageId, draft);
        return;
      } catch (error) {
        slot.attemptCount += 1;
        slot.lastError =
          error instanceof Error ? error.message : "Unknown error";
        await this.saveDraft(pageId, draft);
        if (attempt === maximumAttempts) throw error;
        logger.warn("Editorial page story generation retry scheduled", {
          operationId,
          pageId,
          marketId: slot.market.market_id,
          attempt,
          maximumAttempts,
          message: slot.lastError,
        });
        await delay(this.config.generationRetryBaseDelayMs * attempt);
      }
    }
  }

  private async generateDraftIllustration(
    pageId: CategoryPageId,
    draft: PageDraft,
    index: number,
    operationId: string,
  ): Promise<void> {
    const slot = draft.stories[index];
    const story = slot?.story;
    if (!slot || !story || !this.storyImageGenerator || story.illustration)
      return;
    const config = this.getPageConfig(pageId);
    const role = getStoryRole(config, index);
    const preset = getImagePreset(role, story.category);
    if (!preset) return;

    const maximumAttempts = this.config.generationRetryCount + 1;
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        const image = await this.storyImageGenerator.generateStoryImage({
          story,
          role,
          preset,
        });
        const objectKey = getIllustrationObjectKey(
          pageId,
          draft.edition.id,
          story.id,
          image.contentType,
        );
        await this.store.putObject(objectKey, image.bytes, image.contentType);
        story.illustration = {
          src: getIllustrationSource(pageId, story.id),
          alt: image.alt,
          placement:
            config.kind === "category" &&
            imagePresets[preset].aspectRatio === "4:5"
              ? "float-left"
              : "wide",
          aspectRatio: imagePresets[preset].aspectRatio,
          asset: { objectKey, contentType: image.contentType, preset },
        };
        slot.illustrationAttemptCount =
          (slot.illustrationAttemptCount ?? 0) + 1;
        delete slot.illustrationLastError;
        await this.saveDraft(pageId, draft);
        logger.info("Editorial page illustration generated", {
          operationId,
          pageId,
          storyId: story.id,
        });
        return;
      } catch (error) {
        slot.illustrationAttemptCount =
          (slot.illustrationAttemptCount ?? 0) + 1;
        slot.illustrationLastError =
          error instanceof Error ? error.message : "Unknown error";
        await this.saveDraft(pageId, draft);
        if (attempt === maximumAttempts) throw error;
        logger.warn("Editorial page illustration generation retry scheduled", {
          operationId,
          pageId,
          marketId: slot.market.market_id,
          attempt,
          maximumAttempts,
          message: slot.illustrationLastError,
        });
        await delay(this.config.generationRetryBaseDelayMs * attempt);
      }
    }
  }

  private async saveDraft(
    pageId: CategoryPageId,
    draft: PageDraft,
  ): Promise<void> {
    draft.updatedAt = new Date().toISOString();
    await this.store.putJson(
      this.getPageKeys(pageId).draft,
      pageDraftSchema.parse(draft),
    );
  }

  private async deleteDraftIllustrations(
    pageId: CategoryPageId,
    draft: PageDraft,
    operationId: string,
  ): Promise<void> {
    for (const slot of draft.stories) {
      const objectKey = slot.story?.illustration?.asset?.objectKey;
      if (!objectKey) continue;
      try {
        await this.store.deleteObject(objectKey);
      } catch (error) {
        logger.warn("Expired editorial page illustration cleanup failed", {
          operationId,
          pageId,
          editionId: draft.edition.id,
          objectKey,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  private async promoteDraft(
    pageId: CategoryPageId,
    draft: PageDraft,
    operationId: string,
  ): Promise<Page> {
    const [lead, ...secondary] = draft.stories;
    if (!lead?.story || secondary.some((slot) => !slot.story)) {
      throw new Error("Editorial page draft has unfinished stories.");
    }
    const config = this.getPageConfig(pageId);
    const page =
      config.kind === "front"
        ? this.createFrontPage(draft, lead, secondary)
        : this.createCategoryPage(pageId, config, draft, lead, secondary);
    await this.store.putJson(this.getPageKeys(pageId).current, page);
    try {
      await this.store.deleteJson(this.getPageKeys(pageId).draft);
    } catch (error) {
      logger.warn("Editorial page draft cleanup failed", {
        operationId,
        pageId,
        editionId: page.edition.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    logger.info("Editorial page generation completed", {
      operationId,
      pageId,
      editionId: page.edition.id,
      objectKey: this.getPageKeys(pageId).current,
    });
    return page;
  }

  private createFrontPage(
    draft: PageDraft,
    lead: PageDraft["stories"][number],
    secondary: PageDraft["stories"],
  ): FrontPage {
    if (!lead.story)
      throw new Error("Front-page draft is missing its lead story.");
    const secondaryStories = secondary.map((slot) => {
      if (!slot.story)
        throw new Error("Front-page draft has an unfinished secondary story.");
      return withMarketPanel(slot.story, slot.market);
    });
    return frontPageSchema.parse({
      pageNumber: 1,
      edition: draft.edition,
      leadStory: withMarketPanel(lead.story, lead.market),
      secondaryStories,
      briefs: draft.briefMarkets.map(toMarketBrief),
      hotMarkets: draft.marketCandidates.map((market) => ({
        market: toMarketReference(market),
        probability: getMarketProbability(market),
        change24h: market.one_day_price_change ?? undefined,
      })),
    }) as FrontPage;
  }

  private createCategoryPage(
    pageId: CategoryPageId,
    config: CategoryPageConfig,
    draft: PageDraft,
    lead: PageDraft["stories"][number],
    secondary: PageDraft["stories"],
  ): CategoryPage {
    if (
      pageId === "front" ||
      !lead.story ||
      secondary.some((slot) => !slot.story)
    ) {
      throw new Error("Category-page draft has unfinished stories.");
    }
    return categoryPageSchema.parse({
      pageNumber: config.pageNumber,
      category: {
        id: pageId,
        label: config.label,
        shortLabel: config.shortLabel,
        description: config.description,
      },
      edition: draft.edition,
      layoutVariant: config.layoutVariant,
      leadStory: lead.story,
      secondaryStories: secondary.map((slot) => slot.story),
      briefs: draft.briefMarkets.map((market) =>
        toCategoryBrief(market, config.storyCategory),
      ),
      sidebar: createSidebar(config, draft.marketCandidates),
      marketBoard: {
        title: `${config.label} Market Board`,
        items: draft.marketCandidates
          .slice(0, config.marketBoardCount)
          .map((market) => ({
            id: market.market_id,
            label: market.question ?? "Untitled prediction market",
            probability: getMarketProbability(market),
            change24h: market.one_day_price_change ?? undefined,
            volume24hUsd: market.volume_24hr ?? undefined,
            market: toMarketReference(market),
          })),
      },
    }) as CategoryPage;
  }
}

export function createEditorialEngine(
  options: EditorialEngineOptions,
): EditorialEngine {
  return new EditorialEngine(options);
}

export { ObjectNotFoundError };
