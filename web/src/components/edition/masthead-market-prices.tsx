"use client";

import { useGetCryptoPrices } from "@/api/getCryptoPrices";

function formatUsdPrice(value: number | undefined) {
  if (value === undefined) return "—";

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: value >= 10_000 ? "compact" : "standard",
    maximumFractionDigits: value >= 10_000 ? 1 : 0,
  }).format(value);
}

export function MastheadMarketPrices() {
  const { data: prices } = useGetCryptoPrices();
  const displayedPrices = prices ?? [
    { symbol: "BTC" as const },
    { symbol: "ETH" as const },
    { symbol: "ZEC" as const },
  ];

  return (
    <dl className="mx-auto flex w-28 flex-col gap-1 font-mono text-xs font-semibold tracking-[0.08em] tabular-nums lg:mx-0">
      {displayedPrices.map((price) => (
        <div
          key={price.symbol}
          className="grid grid-cols-[2.5rem_1fr] items-baseline gap-2"
        >
          <dt className="text-destructive">{price.symbol}</dt>
          <dd className="text-right text-foreground">
            {formatUsdPrice(price.usd)}
          </dd>
        </div>
      ))}
    </dl>
  );
}
