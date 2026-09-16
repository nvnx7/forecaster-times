"use client";

import { useQuery } from "@tanstack/react-query";
import { mockHotMarkets } from "@/api/mock/hot-markets";
import type { HotMarket } from "@/types";

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
