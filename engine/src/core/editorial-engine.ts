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
  categoryPageIds,
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
  editionManifestSchema,
  frontPageSchema,
  latestEditionSchema,
  pageDraftSchema,
} from "../schema";
import {
  draftPublishableIllustrationKey,
  draftPublishableManifestKey,
  draftPublishablePageKey,
  draftPublishablePrefix,
  draftRootPrefix,
  draftWorkPageKey,
  draftWorkStateKey,
  editionIllustrationKey,
  editionManifestKey,
  editionPageKey,
  editionPrefix,
  latestEditionKey,
} from "../storage-keys";
import type { StoryGenerator } from "../story-generators";
import type {
  CategoryPage,
  CategoryPageId,
  DraftState,
  EditionManifest,
  EditionManifestPage,
  FrontPage,
  LatestEdition,
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
  PageDraft,
  PolymarketMarket,
  Story,
  StorySource,
} from "../types";
import {
  createCategorySidebar,
  getIllustrationSource,
  getMarketProbability,
  getStoryRole,
  sortMarkets,
  toCategoryBrief,
  toMarketBrief,
  toMarketPanel,
  toMarketReference,
  withMarketPanel,
} from "../utils";

const maxSourcesPerStory = 2;

type Page = FrontPage | CategoryPage;
type ResearchedMarket = { market: PolymarketMarket; sources: StorySource[] };

class NoResearchedMarketsError extends Error {
  constructor(pageId: CategoryPageId) {
    super(`No researched markets available for ${pageId}.`);
    this.name = "NoResearchedMarketsError";
  }
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

/** Generates draft pages and publishes complete, immutable editorial editions. */
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

  async publishEdition(
    categoryIds: readonly Exclude<CategoryPageId, "front">[] = categoryPageIds,
  ): Promise<Map<CategoryPageId, Page>> {
    const operationId = crypto.randomUUID();
    logger.info("Edition generation started", { operationId });
    try {
      const pageIds = this.getSelectedPageIds(categoryIds);
      const state = await this.getOrCreateDraftState(operationId);
      const drafts = new Map<CategoryPageId, PageDraft>();
      const skippedPages = new Map<Exclude<CategoryPageId, "front">, string>();
      for (const pageId of pageIds) {
        try {
          const draft = await this.getOrCreatePageDraft(
            pageId,
            state,
            operationId,
          );
          await this.generateDraftStories(pageId, draft, operationId);
          drafts.set(pageId, draft);
        } catch (error) {
          if (
            pageId === "front" ||
            !(error instanceof NoResearchedMarketsError)
          ) {
            throw error;
          }
          skippedPages.set(pageId, error.message);
          logger.warn("Edition category page skipped", {
            operationId,
            pageId,
            message: error.message,
          });
        }
      }
      const pages = await this.publishDraft(
        state,
        drafts,
        skippedPages,
        pageIds,
        operationId,
      );
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

  async publishDraftEdition(
    categoryIds: readonly Exclude<CategoryPageId, "front">[] = categoryPageIds,
  ): Promise<Map<CategoryPageId, Page>> {
    const operationId = crypto.randomUUID();
    logger.info("Draft edition publication started", { operationId });
    try {
      const pageIds = this.getSelectedPageIds(categoryIds);
      const state = await this.getDraftState();
      if (!state) throw new ObjectNotFoundError("Edition draft");

      const pages = new Map<CategoryPageId, Page>();
      const skippedPages = new Map<Exclude<CategoryPageId, "front">, string>();
      for (const pageId of pageIds) {
        const page = await this.getPublishableDraftPage(pageId);
        if (page) {
          pages.set(pageId, page);
          continue;
        }
        if (pageId === "front") {
          throw new ObjectNotFoundError("Publishable front-page draft");
        }
        skippedPages.set(pageId, "Category page was not drafted.");
      }

      const published = await this.promotePublishableDraft(
        state,
        pages,
        skippedPages,
        pageIds,
        operationId,
        new Date().toISOString(),
      );
      logger.info("Draft edition publication completed", {
        operationId,
        editionId: state.editionId,
        pageIds: [...published.keys()],
        skippedPageIds: [...skippedPages.keys()],
      });
      return published;
    } catch (error) {
      logger.error("Draft edition publication failed", {
        operationId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  async draftFrontPage(): Promise<FrontPage> {
    return (await this.draftPage("front")) as FrontPage;
  }

  async draftCategoryPage(categoryId: CategoryPageId): Promise<CategoryPage> {
    this.getCategoryConfig(categoryId);
    return (await this.draftPage(categoryId)) as CategoryPage;
  }

  async draftCategoryPages(
    categoryIds: readonly Exclude<CategoryPageId, "front">[] = categoryPageIds,
  ): Promise<Map<Exclude<CategoryPageId, "front">, CategoryPage>> {
    const pages = new Map<Exclude<CategoryPageId, "front">, CategoryPage>();
    for (const categoryId of this.getSelectedCategoryIds(categoryIds)) {
      pages.set(categoryId, await this.draftCategoryPage(categoryId));
    }
    return pages;
  }

  async draftPage(pageId: CategoryPageId): Promise<Page> {
    const operationId = crypto.randomUUID();
    logger.info("Page draft generation started", { operationId, pageId });
    try {
      const state = await this.getOrCreateDraftState(operationId);
      const pageDraft = await this.getOrCreatePageDraft(
        pageId,
        state,
        operationId,
      );
      await this.generateDraftStories(pageId, pageDraft, operationId);
      const page = await this.materializeDraftPage(pageId, pageDraft);
      logger.info("Page draft generation completed", {
        operationId,
        pageId,
        editionId: state.editionId,
      });
      return page;
    } catch (error) {
      logger.error("Page draft generation failed", {
        operationId,
        pageId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
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
    await this.store.putJson(draftWorkStateKey, draftState);
    return draftState;
  }

  private async getOrCreatePageDraft(
    pageId: CategoryPageId,
    state: DraftState,
    operationId: string,
  ): Promise<PageDraft> {
    const existingDraft = await this.getDraftPageState(pageId);
    if (existingDraft) return existingDraft;

    const config = this.getPageConfig(pageId);
    const { data } = await this.listPolymarketMarkets({
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
      throw new NoResearchedMarketsError(pageId);
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
    await this.saveDraftPage(pageId, draft, state);
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
      if (!slot.story) await this.generateDraftStory(pageId, draft, index);
      await this.generateDraftIllustration(pageId, draft, index, operationId);
    }
  }

  private async generateDraftStory(
    pageId: CategoryPageId,
    draft: PageDraft,
    index: number,
  ): Promise<void> {
    const slot = draft.stories[index];
    if (!slot) throw new Error(`Draft story ${index} does not exist.`);
    await this.invalidateDraftIllustration(pageId, slot.story);
    slot.story = undefined;
    await this.saveDraftPage(pageId, draft);

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
      await this.saveDraftPage(pageId, draft);
    } catch (error) {
      slot.attemptCount += 1;
      slot.lastError = error instanceof Error ? error.message : "Unknown error";
      await this.saveDraftPage(pageId, draft);
      throw error;
    }
  }

  private async invalidateDraftIllustration(
    pageId: CategoryPageId,
    story: Story | undefined,
  ): Promise<void> {
    const asset = story?.illustration?.asset;
    if (!story?.illustration) return;

    delete story.illustration;
    if (!asset) return;
    await this.store.deleteObject(
      draftPublishableIllustrationKey(pageId, story.id, asset.contentType),
    );
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
    try {
      const image = await this.storyImageGenerator.generateStoryImage({
        story,
        role,
        preset,
      });
      const draftKey = draftPublishableIllustrationKey(
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
          generatedBy: image.generatedBy,
        },
      };
      slot.illustrationAttemptCount = (slot.illustrationAttemptCount ?? 0) + 1;
      delete slot.illustrationLastError;
      await this.saveDraftPage(pageId, draft);
      logger.info("Draft illustration generated", {
        operationId,
        pageId,
        storyId: story.id,
        ...image.generatedBy,
      });
    } catch (error) {
      slot.illustrationAttemptCount = (slot.illustrationAttemptCount ?? 0) + 1;
      slot.illustrationLastError =
        error instanceof Error ? error.message : "Unknown error";
      await this.saveDraftPage(pageId, draft);
      logger.warn("Draft illustration generation failed", {
        operationId,
        pageId,
        storyId: story.id,
        attempt: slot.illustrationAttemptCount,
        message: slot.illustrationLastError,
      });
    }
  }

  private async saveDraftPage(
    pageId: CategoryPageId,
    draft: PageDraft,
    state?: DraftState,
  ): Promise<void> {
    draft.updatedAt = new Date().toISOString();
    await this.store.putJson(
      draftWorkPageKey(pageId),
      pageDraftSchema.parse(draft),
    );
    const draftState = state ?? (await this.getDraftState());
    if (draftState) {
      draftState.updatedAt = draft.updatedAt;
      await this.store.putJson(
        draftWorkStateKey,
        draftStateSchema.parse(draftState),
      );
    }
  }

  private async publishDraft(
    state: DraftState,
    drafts: Map<CategoryPageId, PageDraft>,
    skippedPages: ReadonlyMap<Exclude<CategoryPageId, "front">, string>,
    pageIds: readonly CategoryPageId[],
    operationId: string,
  ): Promise<Map<CategoryPageId, Page>> {
    const publishedAt = new Date().toISOString();
    const pages = new Map<CategoryPageId, Page>();
    for (const pageId of pageIds) {
      const draft = drafts.get(pageId);
      if (!draft) {
        continue;
      }
      draft.edition = { id: state.editionId, now: publishedAt };
      const page = await this.materializeDraftPage(pageId, draft);
      pages.set(pageId, page);
    }
    return this.promotePublishableDraft(
      state,
      pages,
      skippedPages,
      pageIds,
      operationId,
      publishedAt,
    );
  }

  private async promotePublishableDraft(
    state: DraftState,
    pages: ReadonlyMap<CategoryPageId, Page>,
    skippedPages: ReadonlyMap<Exclude<CategoryPageId, "front">, string>,
    pageIds: readonly CategoryPageId[],
    operationId: string,
    publishedAt: string,
  ): Promise<Map<CategoryPageId, Page>> {
    const publishedPages = new Map<CategoryPageId, Page>();
    const manifestPages: EditionManifestPage[] = [];
    for (const pageId of pageIds) {
      const page = pages.get(pageId);
      if (!page) {
        const reason = skippedPages.get(
          pageId as Exclude<CategoryPageId, "front">,
        );
        if (!reason) throw new Error(`Draft is missing ${pageId}.`);
        manifestPages.push({
          id: pageId as Exclude<CategoryPageId, "front">,
          status: "skipped",
          reason,
        });
        continue;
      }
      const publishedPage = this.parsePage(pageId, {
        ...page,
        edition: { id: state.editionId, now: publishedAt },
      });
      await this.store.putJson(draftPublishablePageKey(pageId), publishedPage);
      publishedPages.set(pageId, publishedPage);
      manifestPages.push({
        id: pageId,
        status: "published",
        objectKey: editionPageKey(state.editionId, pageId),
      });
    }
    const manifest: EditionManifest = {
      version: 1,
      editionId: state.editionId,
      createdAt: state.startedAt,
      publishedAt,
      pages: manifestPages,
    };
    await this.store.putJson(
      draftPublishableManifestKey,
      editionManifestSchema.parse(manifest),
    );
    await this.store.movePrefix(
      draftPublishablePrefix,
      editionPrefix(state.editionId),
    );
    await this.store.putJson(latestEditionKey, {
      editionId: state.editionId,
      publishedAt,
    } satisfies LatestEdition);
    await this.clearDraft(state, operationId);
    return publishedPages;
  }

  private async materializeDraftPage(
    pageId: CategoryPageId,
    draft: PageDraft,
  ): Promise<Page> {
    const page = this.createPage(pageId, draft);
    await this.store.putJson(draftPublishablePageKey(pageId), page);
    return page;
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
      sidebar: createCategorySidebar(config, draft.marketCandidates),
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
    await this.store.deletePrefix(draftRootPrefix);
    logger.info("Expired draft discarded", {
      operationId,
      editionId: state.editionId,
    });
  }

  private async clearDraft(
    state: DraftState,
    operationId: string,
  ): Promise<void> {
    await this.store.deletePrefix(draftRootPrefix);
    logger.info("Published draft cleared", {
      operationId,
      editionId: state.editionId,
    });
  }

  get frontPageDraftKey(): string {
    return draftPublishablePageKey("front");
  }

  async getPage(pageId: CategoryPageId): Promise<Page> {
    const latest = await this.getLatestEdition();
    const document = await this.store.getJson<unknown>(
      await this.getPublishedPageKey(latest.editionId, pageId),
    );
    return pageId === "front"
      ? (frontPageSchema.parse(document) as FrontPage)
      : (categoryPageSchema.parse(document) as CategoryPage);
  }

  async getFrontPage(): Promise<FrontPage> {
    return (await this.getPage("front")) as FrontPage;
  }

  async getLatestEditionManifest(): Promise<EditionManifest> {
    const latest = await this.getLatestEdition();
    const manifest = await this.getEditionManifest(latest.editionId);
    if (!manifest)
      throw new ObjectNotFoundError(`Edition ${latest.editionId} manifest`);
    return manifest;
  }

  async getDraftPage(pageId: CategoryPageId): Promise<Page> {
    const publishablePage = await this.getPublishableDraftPage(pageId);
    if (publishablePage) return publishablePage;
    const draft = await this.getDraftPageState(pageId);
    if (!draft) throw new ObjectNotFoundError(`Draft page: ${pageId}`);
    return this.materializeDraftPage(pageId, draft);
  }

  async getDraftFrontPage(): Promise<FrontPage> {
    return (await this.getDraftPage("front")) as FrontPage;
  }

  async getCategoryPage(categoryId: CategoryPageId): Promise<CategoryPage> {
    this.getCategoryConfig(categoryId);
    return (await this.getPage(categoryId)) as CategoryPage;
  }

  async getDraftCategoryPage(
    categoryId: CategoryPageId,
  ): Promise<CategoryPage> {
    this.getCategoryConfig(categoryId);
    return (await this.getDraftPage(categoryId)) as CategoryPage;
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
    if (!asset)
      throw new ObjectNotFoundError(`${pageId} illustration: ${storyId}`);
    return this.store.getObject(asset.objectKey);
  }

  async getFrontPageIllustration(storyId: string): Promise<StoredObject> {
    return this.getIllustration("front", storyId);
  }

  async getDraftIllustration(
    pageId: CategoryPageId,
    storyId: string,
  ): Promise<StoredObject> {
    const page = await this.getDraftPage(pageId);
    const story = [page.leadStory, ...page.secondaryStories].find(
      (candidate) => candidate.id === storyId,
    );
    const asset = story?.illustration?.asset;
    if (!asset)
      throw new ObjectNotFoundError(`${pageId} draft illustration: ${storyId}`);
    return this.store.getObject(
      draftPublishableIllustrationKey(pageId, story.id, asset.contentType),
    );
  }

  async getDraftFrontPageIllustration(storyId: string): Promise<StoredObject> {
    return this.getDraftIllustration("front", storyId);
  }

  async getDraftCategoryPageIllustration(
    categoryId: CategoryPageId,
    storyId: string,
  ): Promise<StoredObject> {
    this.getCategoryConfig(categoryId);
    return this.getDraftIllustration(categoryId, storyId);
  }

  async getCategoryPageIllustration(
    categoryId: CategoryPageId,
    storyId: string,
  ): Promise<StoredObject> {
    this.getCategoryConfig(categoryId);
    return this.getIllustration(categoryId, storyId);
  }

  async listPolymarketMarkets(
    params: ListPolymarketMarketsParams = {},
  ): Promise<ListPolymarketMarketsResponse> {
    const tags = params.tags ? [...new Set(params.tags)] : [];
    if (tags.length <= 1) {
      return this.nansen.listPolymarketMarkets(
        params.tags ? { ...params, tags } : params,
      );
    }
    const responses = await Promise.all(
      tags.map((tag) =>
        this.nansen.listPolymarketMarkets({ ...params, tags: [tag] }),
      ),
    );
    const markets = new Map<string, PolymarketMarket>();
    for (const response of responses) {
      for (const market of response.data) markets.set(market.market_id, market);
    }
    return { data: sortMarkets([...markets.values()], params.orderBy) };
  }

  private async getDraftState(): Promise<DraftState | undefined> {
    try {
      const document = await this.store.getJson<unknown>(draftWorkStateKey);
      return draftStateSchema.parse(document) as DraftState;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
  }

  private parsePage(pageId: CategoryPageId, document: unknown): Page {
    return pageId === "front"
      ? (frontPageSchema.parse(document) as FrontPage)
      : (categoryPageSchema.parse(document) as CategoryPage);
  }

  private async getPublishableDraftPage(
    pageId: CategoryPageId,
  ): Promise<Page | undefined> {
    try {
      return this.parsePage(
        pageId,
        await this.store.getJson<unknown>(draftPublishablePageKey(pageId)),
      );
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
  }

  private async getDraftPageState(
    pageId: CategoryPageId,
  ): Promise<PageDraft | undefined> {
    try {
      return pageDraftSchema.parse(
        await this.store.getJson<unknown>(draftWorkPageKey(pageId)),
      ) as PageDraft;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
  }

  private async getLatestEdition(): Promise<LatestEdition> {
    const document = await this.store.getJson<unknown>(latestEditionKey);
    return latestEditionSchema.parse(document) as LatestEdition;
  }

  private async getPublishedPageKey(
    editionId: number,
    pageId: CategoryPageId,
  ): Promise<string> {
    const manifest = await this.getEditionManifest(editionId);
    if (!manifest) return editionPageKey(editionId, pageId);
    const page = manifest.pages.find((candidate) => candidate.id === pageId);
    if (page?.status === "published") return page.objectKey;
    throw new ObjectNotFoundError(`Edition ${editionId} page: ${pageId}`);
  }

  private async getEditionManifest(
    editionId: number,
  ): Promise<EditionManifest | undefined> {
    try {
      return editionManifestSchema.parse(
        await this.store.getJson<unknown>(editionManifestKey(editionId)),
      ) as EditionManifest;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
  }

  private getPageConfig(pageId: CategoryPageId): PageConfig {
    return pageConfigs[pageId];
  }

  private getSelectedPageIds(
    categoryIds: readonly Exclude<CategoryPageId, "front">[],
  ): CategoryPageId[] {
    return ["front", ...this.getSelectedCategoryIds(categoryIds)];
  }

  private getSelectedCategoryIds(
    categoryIds: readonly Exclude<CategoryPageId, "front">[],
  ): Exclude<CategoryPageId, "front">[] {
    const selectedIds = [...new Set(categoryIds)];
    for (const categoryId of selectedIds) this.getCategoryConfig(categoryId);
    return selectedIds;
  }

  private getCategoryConfig(pageId: CategoryPageId): CategoryPageConfig {
    const config = this.getPageConfig(pageId);
    if (config.kind !== "category") {
      throw new Error("The front page is not a category page.");
    }
    return config;
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
}

export function createEditorialEngine(
  options: EditorialEngineOptions,
): EditorialEngine {
  return new EditorialEngine(options);
}

export { ObjectNotFoundError };
