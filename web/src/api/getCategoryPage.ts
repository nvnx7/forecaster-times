"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

import type { CategoryPage, CategoryPageId } from "@/types";

export async function getCategoryPage(
  categoryId: CategoryPageId,
): Promise<CategoryPage> {
  const { data } = await axios.get<CategoryPage>(
    `/api/categories/${categoryId}`,
  );
  return data;
}

export function useGetCategoryPage(categoryId: CategoryPageId, enabled = true) {
  return useQuery({
    queryKey: ["categoryPage", categoryId],
    queryFn: () => getCategoryPage(categoryId),
    enabled,
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
