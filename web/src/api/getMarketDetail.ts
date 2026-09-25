"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import type { MarketPanel } from "@/types";
import {
  polymarketGammaApiUrl,
  toMarketPanelFromGamma,
} from "@/utils/polymarket-gamma";

export async function getMarketDetail(
  market: MarketPanel,
): Promise<MarketPanel> {
  const { data } = await axios.get(
    `${polymarketGammaApiUrl}/markets/${encodeURIComponent(market.marketId)}`,
    {
      params: { include_tag: false },
    },
  );
  return toMarketPanelFromGamma(data, market);
}

/** Shows the saved editorial quote immediately, then replaces it with Gamma data. */
export function useGetMarketDetail(initialMarket: MarketPanel) {
  return useQuery({
    queryKey: ["marketDetail", initialMarket.marketId],
    queryFn: () => getMarketDetail(initialMarket),
    placeholderData: initialMarket,
    refetchInterval: 60_000,
    refetchOnWindowFocus: true,
  });
}
