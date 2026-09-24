"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type { EditionManifest } from "@/types";

export async function getEditionManifest(): Promise<EditionManifest> {
  const { data } = await axios.get<EditionManifest>("/api/edition");
  return data;
}

export function useGetEditionManifest() {
  return useQuery({
    queryKey: ["editionManifest"],
    queryFn: getEditionManifest,
    staleTime: 5 * 60 * 1_000,
    refetchOnWindowFocus: false,
  });
}
