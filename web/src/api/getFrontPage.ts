"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type { FrontPage } from "@/types";

export async function getFrontPage(): Promise<FrontPage> {
  const { data } = await axios.get<FrontPage>("/api/front");

  return data;
}

export function useGetFrontPage() {
  return useQuery({
    queryKey: ["front-page"],
    queryFn: getFrontPage,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
