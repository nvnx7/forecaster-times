"use client";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import type { MarketPanel } from "@/types";

function formatCents(probability: number) {
  return `${Math.round(probability * 100)}¢`;
}

function formatChange(change: number) {
  return `${change >= 0 ? "+" : ""}${Math.round(change * 100)} pts`;
}

function formatUsd(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(value);
}

function handleTrade() {}

export function MarketQuote({ market }: { market: MarketPanel }) {
  return (
    <aside aria-label={`Market quote: ${market.question}`}>
      <Card variant="quote">
        <CardHeader>
          <p className="font-sans text-[0.625rem] font-semibold tracking-[0.12em] uppercase">
            Market Quotation
          </p>
          <CardTitle>{market.question}</CardTitle>
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
                  {formatCents(market.yes)}
                </dd>
              </div>
              <div>
                <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                  No
                </dt>
                <dd className="font-heading text-4xl font-semibold">
                  {formatCents(market.no)}
                </dd>
              </div>
            </div>
            <Separator />
            <div className="grid grid-cols-3 gap-3">
              {market.change24h !== undefined ? (
                <div>
                  <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                    24h
                  </dt>
                  <dd className="font-sans text-sm font-semibold">
                    {formatChange(market.change24h)}
                  </dd>
                </div>
              ) : null}
              {market.volume24hUsd !== undefined ? (
                <div>
                  <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                    Volume
                  </dt>
                  <dd className="font-sans text-sm font-semibold">
                    {formatUsd(market.volume24hUsd)}
                  </dd>
                </div>
              ) : null}
              {market.liquidityUsd !== undefined ? (
                <div>
                  <dt className="font-sans text-[0.625rem] font-semibold tracking-[0.1em] uppercase">
                    Liquidity
                  </dt>
                  <dd className="font-sans text-sm font-semibold">
                    {formatUsd(market.liquidityUsd)}
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
