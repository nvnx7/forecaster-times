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
  draftStateSchema,
  frontPageSchema,
  latestEditionSchema,
  pageDraftSchema,
} from "../schema";
import {
  draftIllustrationKey,
  draftPageKey,
  draftStateKey,
  editionIllustrationKey,
  editionPageKey,
  latestEditionKey,
} from "../storage-keys";
import type { StoryGenerator } from "../story-generators";
import type {
  CategoryBrief,
  CategoryPage,
  CategoryPageId,
  CategorySidebar,
  DraftState,
  FrontPage,
  LatestEdition,
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
  getMarketProbability,
  toMarketBrief,
  toMarketPanel,
  toMarketReference,
  withMarketPanel,
} from "../utils";

const maxSourcesPerStory = 2;
const pageIds = Object.keys(pageConfigs) as CategoryPageId[];

type Page = FrontPage | CategoryPage;
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
  };
  tinyFish: TinyFishClientOptions;
  storyGenerator: StoryGenerator;
  storyImageGenerator?: StoryImageGenerator;
  config?: EditorialEngineConfig;
};

/** Generates and serves complete, immutable editorial editions. */
export class EditorialEngine {
  private readonly config;
  private readonly nansen;
  private readonly store;
  private readonly storyImageGenerator;
  private readonly storyGenerator;
  private readonly tinyFish;

  constructor(options: EditorialEngineOptions) {
    this.config = options.config ?? defaultEditorialEngineConfig;
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
    return latestEditionKey;
  }

  async getPage(pageId: CategoryPageId): Promise<Page> {
    const latest = await this.getLatestEdition();
    const document = await this.store.getJson<unknown>(
      editionPageKey(latest.editionId, pageId),
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
    if (!story) throw new ObjectNotFoundError(`${pageId} story: ${storyId}`);
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

  async publishEdition(): Promise<Map<CategoryPageId, Page>> {
    const operationId = crypto.randomUUID();
    logger.info("Edition generation started", { operationId });
    try {
      const state = await this.getOrCreateDraftState(operationId);
      const drafts = new Map<CategoryPageId, PageDraft>();
      for (const pageId of pageIds) {
        const draft = await this.getOrCreatePageDraft(
          pageId,
          state,
          operationId,
        );
        await this.generateDraftStories(pageId, draft, operationId);
        drafts.set(pageId, draft);
      }
      const pages = await this.publishDraft(state, drafts, operationId);
      logger.info("Edition generation completed", {
        operationId,
        editionId: state.editionId,
      });
      return pages;
    } catch (error) {
      logger.error("Edition generation failed", {
        operationId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async publishPage(pageId: CategoryPageId): Promise<Page> {
    const page = (await this.publishEdition()).get(pageId);
    if (!page) throw new Error(`Edition is missing ${pageId}.`);
    return page;
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

  private async getLatestEdition(): Promise<LatestEdition> {
    const document = await this.store.getJson<unknown>(latestEditionKey);
    return latestEditionSchema.parse(document) as LatestEdition;
  }

  private async getOrCreateDraftState(
    operationId: string,
  ): Promise<DraftState> {
    const state = await this.getDraftState();
    if (state && !this.isDraftExpired(state)) {
      logger.info("Edition draft resumed", {
        operationId,
        editionId: state.editionId,
        startedAt: state.startedAt,
      });
      return state;
    }
    if (state) await this.discardDraft(state, operationId);

    const now = new Date().toISOString();
    const nextEditionId = await this.getNextEditionId();
    const draftState: DraftState = {
      version: 1,
      editionId: nextEditionId,
      startedAt: now,
      updatedAt: now,
    };
    await this.store.putJson(draftStateKey, draftState);
    return draftState;
  }

  private async getDraftState(): Promise<DraftState | undefined> {
    try {
      const document = await this.store.getJson<unknown>(draftStateKey);
      return draftStateSchema.parse(document) as DraftState;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
  }

  private isDraftExpired(state: DraftState): boolean {
    return (
      Date.now() - new Date(state.startedAt).getTime() >
      this.config.draftExpirySeconds * 1_000
    );
  }

  private async getNextEditionId(): Promise<number> {
    try {
      return (await this.getLatestEdition()).editionId + 1;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return 1;
      throw error;
    }
  }

  private async getOrCreatePageDraft(
    pageId: CategoryPageId,
    state: DraftState,
    operationId: string,
  ): Promise<PageDraft> {
    const existingDraft = await this.getPageDraft(pageId);
    if (existingDraft) return existingDraft;

    const config = this.getPageConfig(pageId);
    const { data } = await this.nansen.listPolymarketMarkets({
      status: "active",
      tags: config.kind === "category" ? config.nansenTags : undefined,
      orderBy: [{ field: "volume_24hr", direction: "DESC" }],
      pagination: { page: 1, perPage: config.candidateLimit },
    });
    const candidates = [...data].sort(
      (first, second) => (second.volume_24hr ?? 0) - (first.volume_24hr ?? 0),
    );
    const selections = await this.selectStoryMarkets(
      pageId,
      candidates,
      config.storyCount,
      operationId,
    );
    if (selections.length === 0) {
      throw new Error(`No researched markets available for ${pageId}.`);
    }
    const selectedIds = new Set(
      selections.map(({ market }) => market.market_id),
    );
    const draft: PageDraft = {
      version: 1,
      edition: { id: state.editionId, now: state.startedAt },
      marketCandidates: candidates,
      briefMarkets: candidates
        .filter((market) => !selectedIds.has(market.market_id))
        .slice(0, config.briefCount),
      stories: selections.map(({ market, sources }) => ({
        market,
        sources,
        attemptCount: 0,
      })),
      createdAt: state.startedAt,
      updatedAt: state.updatedAt,
    };
    await this.savePageDraft(pageId, draft, state);
    return draft;
  }

  private async getPageDraft(
    pageId: CategoryPageId,
  ): Promise<PageDraft | undefined> {
    try {
      return pageDraftSchema.parse(
        await this.store.getJson<unknown>(draftPageKey(pageId)),
      ) as PageDraft;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
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
        logger.warn("Edition market skipped after news research", {
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
        await this.savePageDraft(pageId, draft);
        return;
      } catch (error) {
        slot.attemptCount += 1;
        slot.lastError =
          error instanceof Error ? error.message : "Unknown error";
        await this.savePageDraft(pageId, draft);
        if (attempt === maximumAttempts) throw error;
        logger.warn("Edition story generation retry scheduled", {
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
        const draftKey = draftIllustrationKey(
          pageId,
          story.id,
          image.contentType,
        );
        const editionKey = editionIllustrationKey(
          draft.edition.id,
          pageId,
          story.id,
          image.contentType,
        );
        await this.store.putObject(draftKey, image.bytes, image.contentType);
        story.illustration = {
          src: getIllustrationSource(pageId, story.id),
          alt: image.alt,
          placement:
            config.kind === "category" &&
            imagePresets[preset].aspectRatio === "4:5"
              ? "float-left"
              : "wide",
          aspectRatio: imagePresets[preset].aspectRatio,
          asset: {
            objectKey: editionKey,
            contentType: image.contentType,
            preset,
          },
        };
        slot.illustrationAttemptCount =
          (slot.illustrationAttemptCount ?? 0) + 1;
        delete slot.illustrationLastError;
        await this.savePageDraft(pageId, draft);
        logger.info("Draft illustration generated", {
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
        await this.savePageDraft(pageId, draft);
        if (attempt === maximumAttempts) throw error;
        logger.warn("Draft illustration generation retry scheduled", {
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

  private async savePageDraft(
    pageId: CategoryPageId,
    draft: PageDraft,
    state?: DraftState,
  ): Promise<void> {
    draft.updatedAt = new Date().toISOString();
    await this.store.putJson(
      draftPageKey(pageId),
      pageDraftSchema.parse(draft),
    );
    const draftState = state ?? (await this.getDraftState());
    if (draftState) {
      draftState.updatedAt = draft.updatedAt;
      await this.store.putJson(
        draftStateKey,
        draftStateSchema.parse(draftState),
      );
    }
  }

  private async publishDraft(
    state: DraftState,
    drafts: Map<CategoryPageId, PageDraft>,
    operationId: string,
  ): Promise<Map<CategoryPageId, Page>> {
    const publishedAt = new Date().toISOString();
    const pages = new Map<CategoryPageId, Page>();
    for (const pageId of pageIds) {
      const draft = drafts.get(pageId);
      if (!draft) throw new Error(`Draft is missing ${pageId}.`);
      draft.edition = { id: state.editionId, now: publishedAt };
      await this.moveDraftIllustrations(pageId, draft);
      const page = this.createPage(pageId, draft);
      await this.store.putJson(editionPageKey(state.editionId, pageId), page);
      pages.set(pageId, page);
    }
    await this.store.putJson(latestEditionKey, {
      editionId: state.editionId,
      publishedAt,
    } satisfies LatestEdition);
    await this.clearDraft(state, operationId);
    return pages;
  }

  private async moveDraftIllustrations(
    pageId: CategoryPageId,
    draft: PageDraft,
  ): Promise<void> {
    for (const slot of draft.stories) {
      const story = slot.story;
      const asset = story?.illustration?.asset;
      if (!story || !asset) continue;
      await this.store.moveObject(
        draftIllustrationKey(pageId, story.id, asset.contentType),
        asset.objectKey,
      );
    }
  }

  private createPage(pageId: CategoryPageId, draft: PageDraft): Page {
    const [lead, ...secondary] = draft.stories;
    if (!lead?.story || secondary.some((slot) => !slot.story)) {
      throw new Error("Draft has unfinished stories.");
    }
    const config = this.getPageConfig(pageId);
    if (config.kind === "front") {
      return frontPageSchema.parse({
        pageNumber: 1,
        edition: draft.edition,
        leadStory: withMarketPanel(lead.story, lead.market),
        secondaryStories: secondary.map((slot) =>
          withMarketPanel(slot.story as Story, slot.market),
        ),
        briefs: draft.briefMarkets.map(toMarketBrief),
        hotMarkets: draft.marketCandidates.map((market) => ({
          market: toMarketReference(market),
          probability: getMarketProbability(market),
          change24h: market.one_day_price_change ?? undefined,
        })),
      }) as FrontPage;
    }
    if (pageId === "front") throw new Error("Invalid category page ID.");
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

  private async discardDraft(
    state: DraftState,
    operationId: string,
  ): Promise<void> {
    for (const pageId of pageIds) {
      const draft = await this.getPageDraft(pageId);
      if (!draft) continue;
      for (const slot of draft.stories) {
        const story = slot.story;
        const asset = story?.illustration?.asset;
        if (!story || !asset) continue;
        await this.store.deleteObject(
          draftIllustrationKey(pageId, story.id, asset.contentType),
        );
      }
      await this.store.deleteJson(draftPageKey(pageId));
    }
    await this.store.deleteJson(draftStateKey);
    logger.info("Expired draft discarded", {
      operationId,
      editionId: state.editionId,
    });
  }

  private async clearDraft(
    state: DraftState,
    operationId: string,
  ): Promise<void> {
    for (const pageId of pageIds) {
      await this.store.deleteJson(draftPageKey(pageId));
    }
    await this.store.deleteJson(draftStateKey);
    logger.info("Published draft cleared", {
      operationId,
      editionId: state.editionId,
    });
  }
}

export function createEditorialEngine(
  options: EditorialEngineOptions,
): EditorialEngine {
  return new EditorialEngine(options);
}

export { ObjectNotFoundError };
