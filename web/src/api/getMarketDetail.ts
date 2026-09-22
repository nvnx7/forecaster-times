"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type { MarketPanel } from "@/types";

export async function getMarketDetail(marketId: string): Promise<MarketPanel> {
  const { data } = await axios.get<MarketPanel>(
    `/api/markets/${encodeURIComponent(marketId)}`,
  );
  return data;
}

/** Shows the saved editorial quote immediately, then replaces it with Nansen's live quote. */
export function useGetMarketDetail(initialMarket: MarketPanel) {
  return useQuery({
    queryKey: ["marketDetail", initialMarket.marketId],
    queryFn: () => getMarketDetail(initialMarket.marketId),
    placeholderData: initialMarket,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
