"use client";

import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { FrontPageHotMarket } from "@/types";

function polymarketMarketUrl({ market }: FrontPageHotMarket) {
  return market.slug
    ? `https://polymarket.com/event/${encodeURIComponent(market.slug)}`
    : undefined;
}

function TickerItems({
  markets,
  isDuplicate = false,
}: {
  markets: ReadonlyArray<FrontPageHotMarket>;
  isDuplicate?: boolean;
}) {
  return (
    <div
      aria-hidden={isDuplicate || undefined}
      className="flex shrink-0 items-baseline gap-10 pr-10"
    >
      {markets.map((market) => {
        const href = polymarketMarketUrl(market);
        const content = (
          <>
            <span>{market.market.question}</span>
            <span className="text-destructive">
              {Math.round(market.probability * 100)}¢
            </span>
          </>
        );

        return href ? (
          <a
            key={market.market.marketId}
            className={buttonVariants({ variant: "marketTicker" })}
            href={href}
            rel="noreferrer"
            tabIndex={isDuplicate ? -1 : undefined}
            target="_blank"
          >
            {content}
          </a>
        ) : (
          <span
            key={market.market.marketId}
            className={buttonVariants({ variant: "marketTicker" })}
          >
            {content}
          </span>
        );
      })}
    </div>
  );
}

export function HotMarketsTicker({
  hotMarkets,
}: {
  hotMarkets: readonly FrontPageHotMarket[];
}) {
  if (hotMarkets.length === 0) {
    return null;
  }

  return (
    <section
      aria-label="Hot prediction markets"
      className="hot-markets-ticker flex flex-col gap-1"
    >
      <Separator tone="ink" />
      <div className="flex items-center gap-4 py-1.5">
        <span className="shrink-0 font-mono text-xs font-semibold tracking-[0.08em] text-destructive uppercase">
          Hot Markets
        </span>
        <div className="flex min-w-0 flex-1 justify-center overflow-hidden">
          <div className="hot-markets-track">
            <TickerItems markets={hotMarkets} />
            <TickerItems markets={hotMarkets} isDuplicate />
          </div>
        </div>
      </div>
      <Separator tone="ink" />
    </section>
  );
}
