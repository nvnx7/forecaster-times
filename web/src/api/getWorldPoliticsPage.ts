"use client";

import { useQuery } from "@tanstack/react-query";

import { mockWorldPoliticsPage } from "@/api/mock/world-politics";
import type { SectionPage } from "@/types";

export async function getWorldPoliticsPage(): Promise<SectionPage> {
  return mockWorldPoliticsPage;
}

export function useGetWorldPoliticsPage() {
  return useQuery({
    queryKey: ["sectionPage", "world-politics"],
    queryFn: getWorldPoliticsPage,
    placeholderData: mockWorldPoliticsPage,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
