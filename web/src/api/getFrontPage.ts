"use client";

import { useQuery } from "@tanstack/react-query";
import { mockFrontPage } from "@/api/mock/front-page";
import type { FrontPage } from "@/types";

export async function getFrontPage(): Promise<FrontPage> {
  return mockFrontPage;
}

export function useGetFrontPage() {
  return useQuery({
    queryKey: ["frontPage"],
    queryFn: getFrontPage,
    placeholderData: mockFrontPage,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
