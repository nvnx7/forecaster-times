import { frontPageSchema } from "@/server/front-page-schema";
import { generateFrontPageStory } from "@/server/generate-front-page-story";
import { nansen } from "@/server/nansen";
import { s3, s3FrontPageObjectKey } from "@/server/s3";
import type { FrontPage, MarketPanel, PolymarketMarket, Story } from "@/types";

const hotMarketLimit = 5;

export class StoryGenerationNotConfiguredError extends Error {
  constructor() {
    super("The front-page story generator has not been configured.");
    this.name = "StoryGenerationNotConfiguredError";
  }
}

function clampProbability(value: number): number {
  return Math.min(Math.max(value, 0), 1);
}

function getProbability(market: PolymarketMarket): number {
  if (
    market.last_trade_price !== null &&
    market.last_trade_price !== undefined
  ) {
    return clampProbability(market.last_trade_price);
  }

  if (market.best_bid != null && market.best_ask != null) {
    return clampProbability((market.best_bid + market.best_ask) / 2);
  }

  return 0.5;
}

function toMarketPanel(market: PolymarketMarket): MarketPanel {
  const yes = getProbability(market);

  return {
    marketId: market.market_id,
    question: market.question ?? "Untitled prediction market",
    yes,
    no: 1 - yes,
    change24h: market.one_day_price_change ?? undefined,
    volume24hUsd: market.volume_24hr ?? undefined,
    liquidityUsd: market.liquidity ?? undefined,
    openInterestUsd: market.open_interest ?? undefined,
    placement: "float-right",
  };
}

function withMarketPanel(story: Story, market: PolymarketMarket): Story {
  return {
    ...story,
    market: toMarketPanel(market),
  };
}

function createFrontPage(
  leadStory: Story,
  markets: PolymarketMarket[],
): FrontPage {
  const now = new Date();

  return {
    pageNumber: 1,
    edition: {
      id: `front-page-${now.toISOString().slice(0, 10)}`,
      date: now.toISOString(),
      displayDate: new Intl.DateTimeFormat("en-US", {
        weekday: "long",
        month: "long",
        day: "numeric",
        year: "numeric",
      }).format(now),
      editionLabel: "Daily Edition",
      tagline: "The newspaper of what happens next",
    },
    leadStory,
    secondaryStories: [],
    briefs: [],
    marketStrip: {
      title: "Hot Markets",
      items: markets.map((market) => ({
        id: market.market_id,
        label: market.question ?? "Untitled prediction market",
        probability: getProbability(market),
        change24h: market.one_day_price_change ?? undefined,
      })),
    },
  };
}

/**
 * Builds and publishes one complete front-page edition. This is an editorial
 * operation and must only run through a secured internal trigger.
 */
export async function generateFrontPageEdition(): Promise<FrontPage> {
  const { data: markets } = await nansen.listPolymarketMarkets({
    status: "active",
    orderBy: [{ field: "volume_24hr", direction: "DESC" }],
    pagination: { page: 1, perPage: hotMarketLimit },
  });
  const [leadMarket] = markets;

  if (!leadMarket) {
    throw new Error("Nansen returned no active markets for the front page.");
  }

  const generatedStory = await generateFrontPageStory(leadMarket);

  if (!generatedStory) {
    throw new StoryGenerationNotConfiguredError();
  }

  const frontPage = frontPageSchema.parse(
    createFrontPage(withMarketPanel(generatedStory, leadMarket), markets),
  );

  await s3.putJson(s3FrontPageObjectKey, frontPage);

  return frontPage;
}
