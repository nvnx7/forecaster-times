"use client";

import { useQuery } from "@tanstack/react-query";

const coins = [
  { id: "bitcoin", symbol: "BTC" },
  { id: "ethereum", symbol: "ETH" },
  { id: "zcash", symbol: "ZEC" },
] as const;

type CoinId = (typeof coins)[number]["id"];
type CoinGeckoPriceResponse = Partial<Record<CoinId, { usd?: number }>>;

export type CryptoPrice = {
  symbol: (typeof coins)[number]["symbol"];
  usd?: number;
};

export async function getCryptoPrices(): Promise<CryptoPrice[]> {
  const response = await fetch(
    "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin,ethereum,zcash&vs_currencies=usd",
    { cache: "no-store" },
  );
  if (!response.ok) {
    throw new Error("CoinGecko price request failed.");
  }

  const prices = (await response.json()) as CoinGeckoPriceResponse;
  return coins.map(({ id, symbol }) => ({ symbol, usd: prices[id]?.usd }));
}

export function useGetCryptoPrices() {
  return useQuery({
    queryKey: ["cryptoPrices"],
    queryFn: getCryptoPrices,
    staleTime: 120_000,
    refetchInterval: 60_000,
    refetchOnWindowFocus: false,
  });
}
