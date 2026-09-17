import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type {
  ListPolymarketMarketsParams,
  ListPolymarketMarketsResponse,
} from "@/types";

export async function listPolymarketMarkets(
  params: ListPolymarketMarketsParams = {},
): Promise<ListPolymarketMarketsResponse> {
  const { data } = await axios.post<ListPolymarketMarketsResponse>(
    "/api/markets",
    params,
  );

  return data;
}

export function useListPolymarketMarkets(
  params: ListPolymarketMarketsParams = {},
) {
  return useQuery({
    queryKey: ["polymarketMarkets", params],
    queryFn: () => listPolymarketMarkets(params),
    staleTime: 60_000,
    refetchOnWindowFocus: false,
  });
}
