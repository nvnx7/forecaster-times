"use client";

import { useState } from "react";

import { useGetEditionManifest } from "@/api/getEditionManifest";
import { CategoryPage } from "@/components/edition/category-page";
import { EditionShell } from "@/components/edition/edition-shell";
import { FrontPage } from "@/components/edition/front-page";
import type { CategoryPageId } from "@/types";

const categoryLabels: Record<Exclude<CategoryPageId, "front">, string> = {
  "world-politics": "World & Politics",
  "money-markets": "Money & Markets",
  "technology-culture": "Technology & Culture",
  sports: "Sports",
  crypto: "Crypto",
};

export function NewspaperIssue() {
  const { data: manifest } = useGetEditionManifest();
  const [requestedCategoryId, setRequestedCategoryId] =
    useState<Exclude<CategoryPageId, "front">>();
  const categories = manifest?.pages.flatMap((page) =>
    page.status === "published" && page.id !== "front"
      ? [{ id: page.id, label: categoryLabels[page.id] }]
      : [],
  );

  function selectCategory(categoryId: Exclude<CategoryPageId, "front">) {
    setRequestedCategoryId(categoryId);
    document
      .getElementById(`edition-page-${categoryId}`)
      ?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <EditionShell>
      <div className="flex flex-col gap-3 md:gap-5">
        <FrontPage
          categories={categories ?? []}
          embedded
          onCategorySelect={selectCategory}
        />
        {categories?.map((category) => (
          <div
            key={category.id}
            id={`edition-page-${category.id}`}
            className="scroll-mt-3"
          >
            <CategoryPage
              categoryId={category.id}
              embedded
              forceLoad={requestedCategoryId === category.id}
            />
          </div>
        ))}
      </div>
    </EditionShell>
  );
}
