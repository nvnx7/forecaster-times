"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type { PolymarketMarketOhlcvResponse } from "@/types";

export async function getMarketHistory(
  marketId: string,
): Promise<PolymarketMarketOhlcvResponse> {
  const { data } = await axios.get<PolymarketMarketOhlcvResponse>(
    `/api/markets/${encodeURIComponent(marketId)}/ohlcv`,
    { headers: { "Cache-Control": "no-cache" } },
  );
  return data;
}

export function useGetMarketHistory(marketId: string) {
  return useQuery({
    queryKey: ["marketHistory", marketId],
    queryFn: () => getMarketHistory(marketId),
    staleTime: 120_000,
    refetchInterval: 120_000,
    refetchOnWindowFocus: false,
  });
}
