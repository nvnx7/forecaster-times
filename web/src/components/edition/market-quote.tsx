"use client";

import Image from "next/image";

import { useGetMarketDetail } from "@/api/getMarketDetail";
import { MarketProbabilityChart } from "@/components/edition/market-probability-chart";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
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
import { getPolymarketUrl } from "@/lib/polymarket";
import type { MarketPanel } from "@/types";

function handleTrade() {}

export function MarketQuote({ market }: { market: MarketPanel }) {
  const { data: liveMarket } = useGetMarketDetail(market);
  const displayedMarket = liveMarket ?? market;
  const polymarketUrl = getPolymarketUrl(displayedMarket.marketReference?.slug);

  return (
    <aside aria-label={`Market quote: ${displayedMarket.question}`}>
      <Card variant="quote">
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
          <p className="font-sans text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
            Market Quotation
          </p>
          <CardTitle>{displayedMarket.question}</CardTitle>
          <MarketProbabilityChart marketId={displayedMarket.marketId} />
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
