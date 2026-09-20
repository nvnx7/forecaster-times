import {
  type NansenClient,
  ObjectNotFoundError,
  type S3JsonStore,
  type TinyFishClient,
  TinyFishMarketNewsResearchError,
} from "../clients";
import {
  type CategoryPageConfig,
  categoryPageConfigs,
  defaultEditorialEngineConfig,
  type EditorialEngineConfig,
  imagePresets,
} from "../config";
import type { StoryImageGenerator } from "../image-generators";
import { getImagePreset } from "../image-generators";
import { logger } from "../logger";
import { categoryPageDraftSchema, categoryPageSchema } from "../schema";
import type { StoryGenerator } from "../story-generators";
import type {
  CategoryBrief,
  CategoryPage,
  CategoryPageDraft,
  CategoryPageId,
  CategorySidebar,
  PolymarketMarket,
  StoryRole,
  StorySource,
} from "../types";
import {
  delay,
  getImageExtension,
  getMarketProbability,
  toMarketPanel,
  toMarketReference,
} from "../utils";

const storyCount = 3;
const briefCount = 4;
const marketBoardCount = 6;
const candidateLimit = 16;

type CategoryPagePipelineOptions = {
  nansen: NansenClient;
  store: S3JsonStore;
  tinyFish: TinyFishClient;
  storyGenerator: StoryGenerator;
  storyImageGenerator?: StoryImageGenerator;
  config?: EditorialEngineConfig;
};

function getDraftKey(categoryId: CategoryPageId): string {
  return `editions/categories/${categoryId}/draft.json`;
}

function getCurrentKey(categoryId: CategoryPageId): string {
  return `editions/categories/${categoryId}/current.json`;
}

function getIllustrationKey(
  categoryId: CategoryPageId,
  editionId: string,
  storyId: string,
  contentType: string,
): string {
  return `editions/categories/${categoryId}/${encodeURIComponent(editionId)}/illustrations/${encodeURIComponent(storyId)}.${getImageExtension(contentType)}`;
}

function getRole(index: number): StoryRole {
  return index === 0 ? "category-lead" : "category-secondary";
}

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
  pageConfig: CategoryPageConfig,
  markets: PolymarketMarket[],
): CategorySidebar {
  const items = markets.slice(0, briefCount).map((market) => {
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

  if (pageConfig.sidebar.type === "changes") {
    return {
      type: "changes",
      title: pageConfig.sidebar.title,
      items: items.map(({ change24h: _change24h, ...item }) => item),
    };
  }
  if (pageConfig.sidebar.type === "movers") {
    return {
      type: "movers",
      title: pageConfig.sidebar.title,
      items: items.map(
        ({ previousProbability: _previous, change, ...item }) => item,
      ),
    };
  }
  return {
    type: "odds",
    title: pageConfig.sidebar.title,
    items: items.map(
      ({
        previousProbability: _previous,
        change,
        change24h: _change24h,
        ...item
      }) => item,
    ),
  };
}

/** Shared draft/resume pipeline for every non-front editorial category page. */
export class CategoryPagePipeline {
  private readonly config;

  constructor(private readonly options: CategoryPagePipelineOptions) {
    this.config = options.config ?? defaultEditorialEngineConfig;
  }

  async get(categoryId: CategoryPageId): Promise<CategoryPage> {
    const document = await this.options.store.getJson<unknown>(
      getCurrentKey(categoryId),
    );
    return categoryPageSchema.parse(document) as CategoryPage;
  }

  async getIllustration(
    categoryId: CategoryPageId,
    storyId: string,
  ): Promise<import("../clients").StoredObject> {
    const page = await this.get(categoryId);
    const story = [page.leadStory, ...page.secondaryStories].find(
      (candidate) => candidate.id === storyId,
    );
    const asset = story?.illustration?.asset;
    if (!asset) {
      throw new ObjectNotFoundError(
        `category-page illustration: ${categoryId}/${storyId}`,
      );
    }
    return this.options.store.getObject(asset.objectKey);
  }

  async publish(categoryId: CategoryPageId): Promise<CategoryPage> {
    const operationId = crypto.randomUUID();
    logger.info("Category-page edition generation started", {
      operationId,
      categoryId,
    });

    try {
      const draft = await this.getOrCreateDraft(categoryId, operationId);
      await this.generateStories(draft, operationId);
      return await this.promoteDraft(draft, operationId);
    } catch (error) {
      logger.error("Category-page edition generation failed", {
        operationId,
        categoryId,
        message: error instanceof Error ? error.message : "Unknown error",
      });
      throw error;
    }
  }

  private async getOrCreateDraft(
    categoryId: CategoryPageId,
    operationId: string,
  ): Promise<CategoryPageDraft> {
    const draft = await this.getDraft(categoryId);
    if (draft && !this.isExpired(draft)) {
      logger.info("Category-page draft resumed", {
        operationId,
        categoryId,
        editionId: draft.edition.id,
      });
      return draft;
    }

    if (draft) {
      await this.deleteDraftIllustrations(draft, operationId);
      await this.options.store.deleteJson(getDraftKey(categoryId));
    }
    return this.createDraft(categoryId, operationId);
  }

  private async getDraft(
    categoryId: CategoryPageId,
  ): Promise<CategoryPageDraft | undefined> {
    try {
      const document = await this.options.store.getJson<unknown>(
        getDraftKey(categoryId),
      );
      return categoryPageDraftSchema.parse(document) as CategoryPageDraft;
    } catch (error) {
      if (error instanceof ObjectNotFoundError) return undefined;
      throw error;
    }
  }

  private isExpired(draft: CategoryPageDraft): boolean {
    return (
      Date.now() - new Date(draft.createdAt).getTime() >
      this.config.editionWindowSeconds * 1_000
    );
  }

  private async createDraft(
    categoryId: CategoryPageId,
    operationId: string,
  ): Promise<CategoryPageDraft> {
    const pageConfig = categoryPageConfigs[categoryId];
    const { data } = await this.options.nansen.listPolymarketMarkets({
      status: "active",
      tags: pageConfig.nansenTags,
      orderBy: [{ field: "volume_24hr", direction: "DESC" }],
      pagination: { page: 1, perPage: candidateLimit },
    });
    const candidates = [...data].sort(
      (first, second) => (second.volume_24hr ?? 0) - (first.volume_24hr ?? 0),
    );
    const selections: { market: PolymarketMarket; sources: StorySource[] }[] =
      [];
    for (const market of candidates) {
      if (selections.length === storyCount) break;
      try {
        const sources = await this.options.tinyFish.searchMarketNews(market);
        if (sources.length > 0)
          selections.push({ market, sources: sources.slice(0, 2) });
      } catch (error) {
        if (!(error instanceof TinyFishMarketNewsResearchError)) throw error;
        logger.warn("Category-page market skipped after news research", {
          operationId,
          categoryId,
          marketId: market.market_id,
          message: error.message,
        });
      }
    }
    if (selections.length === 0) {
      throw new Error(`No researched markets available for ${categoryId}.`);
    }

    const now = new Date().toISOString();
    const selectedIds = new Set(
      selections.map(({ market }) => market.market_id),
    );
    const draft: CategoryPageDraft = {
      version: 1,
      categoryId,
      edition: { id: `${categoryId}-${now}`, now },
      marketCandidates: candidates,
      briefMarkets: candidates
        .filter((market) => !selectedIds.has(market.market_id))
        .slice(0, briefCount),
      stories: selections.map(({ market, sources }) => ({
        market,
        sources,
        attemptCount: 0,
      })),
      createdAt: now,
      updatedAt: now,
    };
    await this.saveDraft(draft);
    return draft;
  }

  private async generateStories(
    draft: CategoryPageDraft,
    operationId: string,
  ): Promise<void> {
    for (const [index, slot] of draft.stories.entries()) {
      if (!slot.story) {
        await this.generateStory(draft, index, operationId);
      }
      await this.generateIllustration(draft, index, operationId);
    }
  }

  private async deleteDraftIllustrations(
    draft: CategoryPageDraft,
    operationId: string,
  ): Promise<void> {
    for (const slot of draft.stories) {
      const objectKey = slot.story?.illustration?.asset?.objectKey;
      if (!objectKey) continue;
      try {
        await this.options.store.deleteObject(objectKey);
      } catch (error) {
        logger.warn("Expired category-page illustration cleanup failed", {
          operationId,
          categoryId: draft.categoryId,
          editionId: draft.edition.id,
          objectKey,
          message: error instanceof Error ? error.message : "Unknown error",
        });
      }
    }
  }

  private async generateStory(
    draft: CategoryPageDraft,
    index: number,
    operationId: string,
  ): Promise<void> {
    const slot = draft.stories[index];
    if (!slot) throw new Error(`Category draft story ${index} does not exist.`);
    const maximumAttempts = this.config.generationRetryCount + 1;
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        slot.story = {
          ...(await this.options.storyGenerator.generateStory(
            slot.market,
            slot.sources,
          )),
          category: categoryPageConfigs[draft.categoryId].storyCategory,
          market: toMarketPanel(slot.market),
        };
        slot.attemptCount += 1;
        delete slot.lastError;
        await this.saveDraft(draft);
        return;
      } catch (error) {
        slot.attemptCount += 1;
        slot.lastError =
          error instanceof Error ? error.message : "Unknown error";
        await this.saveDraft(draft);
        if (attempt === maximumAttempts) throw error;
        logger.warn("Category-page story generation retry scheduled", {
          operationId,
          categoryId: draft.categoryId,
          marketId: slot.market.market_id,
          attempt,
        });
        await delay(this.config.generationRetryBaseDelayMs * attempt);
      }
    }
  }

  private async generateIllustration(
    draft: CategoryPageDraft,
    index: number,
    operationId: string,
  ): Promise<void> {
    const slot = draft.stories[index];
    const story = slot?.story;
    if (
      !slot ||
      !story ||
      !this.options.storyImageGenerator ||
      story.illustration
    )
      return;
    const role = getRole(index);
    const preset = getImagePreset(role, story.category);
    if (!preset) return;

    const maximumAttempts = this.config.generationRetryCount + 1;
    for (let attempt = 1; attempt <= maximumAttempts; attempt += 1) {
      try {
        const image = await this.options.storyImageGenerator.generateStoryImage(
          {
            story,
            role,
            preset,
          },
        );
        const objectKey = getIllustrationKey(
          draft.categoryId,
          draft.edition.id,
          story.id,
          image.contentType,
        );
        await this.options.store.putObject(
          objectKey,
          image.bytes,
          image.contentType,
        );
        story.illustration = {
          src: `/api/categories/${draft.categoryId}/illustrations/${encodeURIComponent(story.id)}`,
          alt: image.alt,
          placement:
            imagePresets[preset].aspectRatio === "4:5" ? "float-left" : "wide",
          aspectRatio: imagePresets[preset].aspectRatio,
          asset: { objectKey, contentType: image.contentType, preset },
        };
        slot.illustrationAttemptCount =
          (slot.illustrationAttemptCount ?? 0) + 1;
        delete slot.illustrationLastError;
        await this.saveDraft(draft);
        logger.info("Category-page illustration generated", {
          operationId,
          categoryId: draft.categoryId,
          storyId: story.id,
        });
        return;
      } catch (error) {
        slot.illustrationAttemptCount =
          (slot.illustrationAttemptCount ?? 0) + 1;
        slot.illustrationLastError =
          error instanceof Error ? error.message : "Unknown error";
        await this.saveDraft(draft);
        if (attempt === maximumAttempts) throw error;
        logger.warn("Category-page illustration generation retry scheduled", {
          operationId,
          categoryId: draft.categoryId,
          marketId: slot.market.market_id,
          attempt,
          maximumAttempts,
          message: slot.illustrationLastError,
        });
        await delay(this.config.generationRetryBaseDelayMs * attempt);
      }
    }
  }

  private async saveDraft(draft: CategoryPageDraft): Promise<void> {
    draft.updatedAt = new Date().toISOString();
    await this.options.store.putJson(
      getDraftKey(draft.categoryId),
      categoryPageDraftSchema.parse(draft),
    );
  }

  private async promoteDraft(
    draft: CategoryPageDraft,
    operationId: string,
  ): Promise<CategoryPage> {
    const [lead, ...secondary] = draft.stories;
    if (!lead?.story || secondary.some((slot) => !slot.story)) {
      throw new Error("Category-page draft has unfinished stories.");
    }
    const pageConfig = categoryPageConfigs[draft.categoryId];
    const page = categoryPageSchema.parse({
      pageNumber: pageConfig.pageNumber,
      category: {
        id: draft.categoryId,
        label: pageConfig.label,
        shortLabel: pageConfig.shortLabel,
        description: pageConfig.description,
      },
      edition: draft.edition,
      layoutVariant: pageConfig.layoutVariant,
      leadStory: lead.story,
      secondaryStories: secondary.map((slot) => slot.story),
      briefs: draft.briefMarkets.map((market) =>
        toCategoryBrief(market, pageConfig.storyCategory),
      ),
      sidebar: createSidebar(pageConfig, draft.marketCandidates),
      marketBoard: {
        title: `${pageConfig.label} Market Board`,
        items: draft.marketCandidates
          .slice(0, marketBoardCount)
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

    await this.options.store.putJson(getDraftKey(draft.categoryId), page);
    await this.options.store.copyObject(
      getDraftKey(draft.categoryId),
      getCurrentKey(draft.categoryId),
    );
    const published = categoryPageSchema.parse(
      await this.options.store.getJson<unknown>(
        getCurrentKey(draft.categoryId),
      ),
    ) as CategoryPage;
    try {
      await this.options.store.deleteJson(getDraftKey(draft.categoryId));
    } catch (error) {
      logger.warn("Category-page draft cleanup failed", {
        operationId,
        categoryId: draft.categoryId,
        editionId: page.edition.id,
        message: error instanceof Error ? error.message : "Unknown error",
      });
    }
    logger.info("Category-page edition generation completed", {
      operationId,
      categoryId: draft.categoryId,
      editionId: page.edition.id,
    });
    return published;
  }
}
