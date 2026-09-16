"use client";

import { useQuery } from "@tanstack/react-query";

export type HotMarket = {
  headline: string;
  odds: string;
};

const mockHotMarkets = [
  { headline: "Fed Rate Cut", odds: "80¢" },
  { headline: "Starship Reaches Orbit", odds: "60¢" },
  { headline: "Bitcoin Above $100K", odds: "73¢" },
  { headline: "U.S. Recession This Year", odds: "22¢" },
  { headline: "Ethereum ETF Inflows", odds: "68¢" },
] satisfies readonly HotMarket[];

export async function getHotMarkets(): Promise<readonly HotMarket[]> {
  return mockHotMarkets;
}

export function useGetHotMarkets() {
  return useQuery({
    queryKey: ["hotMarkets"],
    queryFn: getHotMarkets,
    placeholderData: mockHotMarkets,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
