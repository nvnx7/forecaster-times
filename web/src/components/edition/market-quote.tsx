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
      <Card size="sm">
        <CardHeader>
          <p className="font-sans text-[0.625rem] font-semibold tracking-[0.12em] text-destructive uppercase">
            Market Quote
          </p>
          <CardTitle>{market.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <Separator />
          <dl className="grid grid-cols-2 gap-x-4 gap-y-3 py-3">
            <div>
              <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                Yes
              </dt>
              <dd className="font-mono text-3xl font-semibold text-foreground">
                {formatCents(market.yes)}
              </dd>
            </div>
            <div>
              <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                No
              </dt>
              <dd className="font-mono text-3xl font-semibold text-muted-foreground">
                {formatCents(market.no)}
              </dd>
            </div>
            {market.change24h !== undefined ? (
              <div>
                <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                  24h
                </dt>
                <dd className="font-mono text-xs font-semibold text-destructive">
                  {formatChange(market.change24h)}
                </dd>
              </div>
            ) : null}
            {market.volume24hUsd !== undefined ? (
              <div>
                <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                  Volume
                </dt>
                <dd className="font-mono text-xs font-semibold">
                  {formatUsd(market.volume24hUsd)}
                </dd>
              </div>
            ) : null}
            {market.liquidityUsd !== undefined ? (
              <div>
                <dt className="font-mono text-[0.625rem] tracking-[0.1em] text-muted-foreground uppercase">
                  Liquidity
                </dt>
                <dd className="font-mono text-xs font-semibold">
                  {formatUsd(market.liquidityUsd)}
                </dd>
              </div>
            ) : null}
          </dl>
          <Separator />
        </CardContent>
        <CardFooter className="gap-2">
          <Button
            type="button"
            variant="outline"
            size="xs"
            onClick={handleTrade}
          >
            Buy Yes
          </Button>
          <Button
            type="button"
            variant="destructive"
            size="xs"
            onClick={handleTrade}
          >
            Buy No
          </Button>
        </CardFooter>
      </Card>
    </aside>
  );
}
