import { Separator } from "@/components/ui/separator";
import type { CategoryMarketBoard as CategoryMarketBoardData } from "@/types";
import {
  formatChangeInPoints,
  formatProbabilityAsCents,
  formatUsdCompact,
} from "@/utils/market-format";

// A compact newspaper board, deliberately kept distinct from an app dashboard.

export function CategoryMarketBoard({
  board,
}: {
  board: CategoryMarketBoardData;
}) {
  return (
    <section
      aria-labelledby="market-board-title"
      className="flex flex-col gap-3"
    >
      <Separator tone="ink" />
      <header className="text-center">
        <h2
          id="market-board-title"
          className="font-heading text-2xl font-semibold tracking-[0.04em] uppercase"
        >
          {board.title}
        </h2>
        {board.subtitle ? (
          <p className="font-sans text-base italic text-muted-foreground">
            {board.subtitle}
          </p>
        ) : null}
      </header>
      <div className="grid gap-x-5 gap-y-3 md:grid-cols-2 xl:grid-cols-3">
        {board.items.map((item) => (
          <article key={item.id} className="flex flex-col gap-2">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-baseline gap-x-3">
              <h3 className="font-sans text-base leading-5 font-semibold">
                {item.label}
              </h3>
              <p className="font-heading text-2xl leading-none font-semibold">
                {formatProbabilityAsCents(item.probability)}
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                {item.change24h !== undefined
                  ? formatChangeInPoints(item.change24h)
                  : ""}
              </p>
              <p className="font-sans text-sm text-muted-foreground">
                {item.volume24hUsd !== undefined
                  ? `Vol. ${formatUsdCompact(item.volume24hUsd)}`
                  : ""}
              </p>
            </div>
            <Separator />
          </article>
        ))}
      </div>
    </section>
  );
}
