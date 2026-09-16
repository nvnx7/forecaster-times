"use client";

import { useGetHotMarkets } from "@/api/getHotMarkets";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { HotMarket } from "@/types";

function handleMarketSelect() {}

function TickerItems({
  markets,
  isDuplicate = false,
}: {
  markets: readonly HotMarket[];
  isDuplicate?: boolean;
}) {
  return (
    <div
      aria-hidden={isDuplicate || undefined}
      className="flex shrink-0 items-baseline gap-10 pr-10"
    >
      {markets.map((market) => (
        <Button
          key={market.headline}
          type="button"
          variant="marketTicker"
          onClick={handleMarketSelect}
          tabIndex={isDuplicate ? -1 : undefined}
        >
          <span>{market.headline}</span>
          <span className="text-destructive">{market.odds}</span>
        </Button>
      ))}
    </div>
  );
}

export function HotMarketsTicker() {
  const { data: hotMarkets = [] } = useGetHotMarkets();

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
        <div className="min-w-0 overflow-hidden">
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
