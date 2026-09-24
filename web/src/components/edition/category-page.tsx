"use client";

import { useEffect, useRef, useState } from "react";

import { useGetCategoryPage } from "@/api/getCategoryPage";
import { CategoryBriefs } from "@/components/edition/category-briefs";
import { CategoryLeadStory } from "@/components/edition/category-lead-story";
import { CategoryMarketBoard } from "@/components/edition/category-market-board";
import { CategorySecondaryStoryRow } from "@/components/edition/category-secondary-story-row";
import { CategorySidebar } from "@/components/edition/category-sidebar";
import { EditionFooter } from "@/components/edition/edition-footer";
import { EditionPaper, EditionShell } from "@/components/edition/edition-shell";
import { InteriorPageHeader } from "@/components/edition/interior-page-header";
import { NewspaperLoader } from "@/components/newspaper-loader";
import { Separator } from "@/components/ui/separator";
import type { CategoryPageId } from "@/types";

export function CategoryPage({
  embedded = false,
  categoryId = "world-politics",
}: {
  embedded?: boolean;
  categoryId?: CategoryPageId;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  const [shouldLoad, setShouldLoad] = useState(!embedded);
  const { data: page, isPending } = useGetCategoryPage(categoryId, shouldLoad);

  useEffect(() => {
    if (shouldLoad) return;
    const target = sentinel.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setShouldLoad(true);
        observer.disconnect();
      },
      { rootMargin: "200px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [shouldLoad]);

  if (!shouldLoad) return <div ref={sentinel} className="min-h-1" />;

  if (isPending) {
    const loadingContent = (
      <EditionPaper>
        <div className="flex min-h-[min(42rem,calc(100dvh-3rem))] items-center justify-center">
          <NewspaperLoader />
        </div>
      </EditionPaper>
    );
    return embedded ? (
      loadingContent
    ) : (
      <EditionShell>{loadingContent}</EditionShell>
    );
  }

  if (!page) {
    return null;
  }

  const content = (
    <EditionPaper>
      <div className="flex flex-col gap-5 px-3 py-4 md:px-5 md:py-6">
        <InteriorPageHeader
          pageNumber={page.pageNumber}
          categoryName={page.category.label}
        />
        <CategoryLeadStory story={page.leadStory} />
        <CategorySecondaryStoryRow
          stories={page.secondaryStories.slice(0, 2)}
        />
        <Separator tone="ink" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_auto_minmax(16rem,0.85fr)]">
          <CategoryBriefs briefs={page.briefs} />
          {page.sidebar ? (
            <Separator className="hidden lg:block" orientation="vertical" />
          ) : null}
          {page.sidebar ? <CategorySidebar sidebar={page.sidebar} /> : null}
        </div>
        {page.marketBoard ? (
          <CategoryMarketBoard board={page.marketBoard} />
        ) : null}
        <EditionFooter
          pageNumber={page.pageNumber}
          categoryName={page.category.label}
        />
      </div>
    </EditionPaper>
  );

  return embedded ? content : <EditionShell>{content}</EditionShell>;
}
