"use client";

import { useGetMarketDetail } from "@/api/getMarketDetail";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import {
  formatChangeInPoints,
  formatProbabilityAsCents,
  formatUsdCompact,
} from "@/lib/market-format";
import type { MarketPanel } from "@/types";

function handleTrade() {}

export function MarketQuote({ market }: { market: MarketPanel }) {
  const { data: liveMarket } = useGetMarketDetail(market);
  const displayedMarket = liveMarket ?? market;

  return (
    <aside aria-label={`Market quote: ${displayedMarket.question}`}>
      <Card variant="quote">
        <CardHeader>
          <p className="font-sans text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
            Market Quotation
          </p>
          <CardTitle>{displayedMarket.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator />
          <dl className="flex flex-col gap-3 py-3">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                  Yes
                </dt>
                <dd className="font-heading text-4xl font-semibold">
                  {formatProbabilityAsCents(displayedMarket.yes)}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                  No
                </dt>
                <dd className="font-heading text-4xl font-semibold">
                  {formatProbabilityAsCents(displayedMarket.no)}
                </dd>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-3">
              {displayedMarket.change24h !== undefined ? (
                <div>
                  <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                    24h
                  </dt>
                  <dd className="font-sans text-sm font-semibold">
                    {formatChangeInPoints(displayedMarket.change24h)}
                  </dd>
                </div>
              ) : null}
              {displayedMarket.volume24hUsd !== undefined ? (
                <div>
                  <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                    Volume
                  </dt>
                  <dd className="font-sans text-sm font-semibold">
                    {formatUsdCompact(displayedMarket.volume24hUsd)}
                  </dd>
                </div>
              ) : null}
              {displayedMarket.liquidityUsd !== undefined ? (
                <div>
                  <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                    Liquidity
                  </dt>
                  <dd className="font-sans text-sm font-semibold">
                    {formatUsdCompact(displayedMarket.liquidityUsd)}
                  </dd>
                </div>
              ) : null}
            </div>
          </dl>
          <Separator />
        </CardContent>
        <CardFooter variant="quote">
          <Button
            type="button"
            variant="marketQuote"
            size="default"
            onClick={handleTrade}
          >
            Yes
          </Button>
          <Button
            type="button"
            variant="marketQuote"
            size="default"
            onClick={handleTrade}
          >
            No
          </Button>
        </CardFooter>
      </Card>
    </aside>
  );
}
