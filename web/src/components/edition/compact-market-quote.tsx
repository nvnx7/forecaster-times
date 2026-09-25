"use client";

import Image from "next/image";

import { useGetMarketDetail } from "@/api/getMarketDetail";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { formatProbabilityAsCents } from "@/lib/market-format";
import { getPolymarketUrl } from "@/lib/polymarket";
import type { MarketPanel } from "@/types";

function handleTrade() {}

/** A compact, live quote for secondary editorial stories. */
export function CompactMarketQuote({ market }: { market: MarketPanel }) {
  const { data: liveMarket } = useGetMarketDetail(market);
  const displayedMarket = liveMarket ?? market;
  const polymarketUrl = getPolymarketUrl(displayedMarket.marketReference?.slug);
  const yes = formatProbabilityAsCents(displayedMarket.yes);
  const no = formatProbabilityAsCents(displayedMarket.no);
  const yesLabel = displayedMarket.yesLabel ?? "Yes";
  const noLabel = displayedMarket.noLabel ?? "No";

  return (
    <aside aria-label={`Market quote: ${displayedMarket.question}`}>
      <Card size="sm" variant="quote">
        <CardHeader>
          <CardAction>
            {polymarketUrl ? (
              <a
                href={polymarketUrl}
                target="_blank"
                rel="noreferrer"
                aria-label="Open this market on Polymarket"
              >
                <Image
                  src="/polymarket.svg"
                  alt=""
                  width={20}
                  height={20}
                  className="size-5"
                />
              </a>
            ) : (
              <Image
                src="/polymarket.svg"
                alt="Polymarket"
                width={20}
                height={20}
                className="size-5"
              />
            )}
          </CardAction>
          <CardTitle>{displayedMarket.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-2 font-mono text-sm font-semibold tabular-nums">
            <div>
              <dt className="text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                {yesLabel} odds
              </dt>
              <dd>{yes}</dd>
            </div>
            <div>
              <dt className="text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                {noLabel} odds
              </dt>
              <dd>{no}</dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter variant="quote">
          <Button
            type="button"
            variant="marketQuote"
            size="sm"
            onClick={handleTrade}
          >
            {yesLabel} · {yes}
          </Button>
          <Button
            type="button"
            variant="marketQuote"
            size="sm"
            onClick={handleTrade}
          >
            {noLabel} · {no}
          </Button>
        </CardFooter>
      </Card>
    </aside>
  );
}
