"use client";

import { useGetCryptoPrices } from "@/api/getCryptoPrices";
import { formatUsd } from "@/utils/market-format";

export function MastheadMarketPrices() {
  const { data: prices } = useGetCryptoPrices();
  const displayedPrices = prices ?? [
    { symbol: "BTC" as const },
    { symbol: "ETH" as const },
    { symbol: "ZEC" as const },
  ];

  return (
    <dl className="mx-auto flex w-32 flex-col gap-1.5 lg:mx-0">
      {displayedPrices.map((price) => (
        <div
          key={price.symbol}
          className="grid grid-cols-[2.5rem_1fr] items-baseline gap-2"
        >
          <dt className="font-sans text-base font-semibold tracking-[0.12em] text-destructive uppercase">
            {price.symbol}:
          </dt>
          <dd className="text-right font-heading text-base leading-none font-bold tabular-nums text-foreground">
            {price.usd === undefined ? "—" : formatUsd(price.usd)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
