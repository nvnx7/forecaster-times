"use client";

import { type ReactNode, useEffect, useState } from "react";

import { useGetFrontPage } from "@/api/getFrontPage";
import { EditionFooter } from "@/components/edition/edition-footer";
import { EditionMetadata } from "@/components/edition/edition-metadata";
import { EditionPaper, EditionShell } from "@/components/edition/edition-shell";
import { HotMarketsTicker } from "@/components/edition/hot-markets-ticker";
import { LeadStory } from "@/components/edition/lead-story";
import { MarketCategoryNavigation } from "@/components/edition/market-category-navigation";
import { Masthead } from "@/components/edition/masthead";
import { SecondaryStoryRow } from "@/components/edition/secondary-story-row";
import { NewspaperLoader } from "@/components/newspaper-loader";

const minimumLoadingDurationMs = 2_000;

export function FrontPage({ embedded = false }: { embedded?: boolean }) {
  const { data: frontPage, isError, isPending } = useGetFrontPage();
  const [minimumLoadingElapsed, setMinimumLoadingElapsed] = useState(false);

  useEffect(() => {
    const timer = window.setTimeout(
      () => setMinimumLoadingElapsed(true),
      minimumLoadingDurationMs,
    );

    return () => window.clearTimeout(timer);
  }, []);

  const wrapInShell = (content: ReactNode) =>
    embedded ? content : <EditionShell>{content}</EditionShell>;

  let editorialContent: ReactNode;

  if (isPending || !minimumLoadingElapsed) {
    editorialContent = (
      <div className="flex min-h-[min(42rem,calc(100dvh-3rem))] items-center justify-center">
        <NewspaperLoader />
      </div>
    );
  } else if (isError || !frontPage) {
    editorialContent = (
      <p className="flex min-h-[min(42rem,calc(100dvh-3rem))] items-center justify-center px-6 text-center font-heading text-xl font-semibold">
        Today&apos;s edition is unavailable.
      </p>
    );
  } else {
    editorialContent = (
      <>
        <EditionMetadata
          edition={frontPage.edition}
          pageNumber={frontPage.pageNumber}
        />
        <HotMarketsTicker marketStrip={frontPage.marketStrip} />
        <MarketCategoryNavigation />
        <LeadStory story={frontPage.leadStory} />
        <SecondaryStoryRow stories={frontPage.secondaryStories.slice(0, 2)} />
        <EditionFooter pageNumber={frontPage.pageNumber} />
      </>
    );
  }

  const content = (
    <EditionPaper>
      <div className="flex flex-col gap-3 px-3 py-4 md:px-5 md:py-6">
        <Masthead />
        {editorialContent}
      </div>
    </EditionPaper>
  );

  return wrapInShell(content);
}
