"use client";

import Image from "next/image";

import { useGetMarketDetail } from "@/api/getMarketDetail";
import { TradeMarketButton } from "@/components/edition/trade-market-button";
import {
  Card,
  CardAction,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { MarketPanel } from "@/types";
import { formatProbabilityAsCents } from "@/utils/market-format";
import { getPolymarketUrl } from "@/utils/polymarket";

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
          <dl className="grid grid-cols-2 gap-3">
            <div>
              <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                {yesLabel} odds
              </dt>
              <dd className="font-heading text-lg leading-none font-semibold tabular-nums">
                {yes}
              </dd>
            </div>
            <div>
              <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] text-muted-foreground uppercase">
                {noLabel} odds
              </dt>
              <dd className="font-heading text-lg leading-none font-semibold tabular-nums">
                {no}
              </dd>
            </div>
          </dl>
        </CardContent>
        <CardFooter variant="quote">
          <TradeMarketButton
            market={displayedMarket}
            outcomeIndex={0}
            size="sm"
          >
            {yesLabel} · {yes}
          </TradeMarketButton>
          <TradeMarketButton
            market={displayedMarket}
            outcomeIndex={1}
            size="sm"
          >
            {noLabel} · {no}
          </TradeMarketButton>
        </CardFooter>
      </Card>
    </aside>
  );
}
