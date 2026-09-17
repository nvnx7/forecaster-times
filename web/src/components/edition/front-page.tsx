"use client";

import { useGetFrontPage } from "@/api/getFrontPage";
import { EditionFooter } from "@/components/edition/edition-footer";
import { EditionMetadata } from "@/components/edition/edition-metadata";
import { EditionPaper, EditionShell } from "@/components/edition/edition-shell";
import { HotMarketsTicker } from "@/components/edition/hot-markets-ticker";
import { LeadStory } from "@/components/edition/lead-story";
import { MarketCategoryNavigation } from "@/components/edition/market-category-navigation";
import { Masthead } from "@/components/edition/masthead";
import { SecondaryStoryRow } from "@/components/edition/secondary-story-row";

export function FrontPage({ embedded = false }: { embedded?: boolean }) {
  const { data: frontPage } = useGetFrontPage();

  if (!frontPage) {
    return null;
  }

  const content = (
    <EditionPaper>
      <div className="flex flex-col gap-3 px-3 py-4 md:px-5 md:py-6">
        <Masthead />
        <EditionMetadata
          edition={frontPage.edition}
          pageNumber={frontPage.pageNumber}
        />
        <HotMarketsTicker />
        <MarketCategoryNavigation />
        <LeadStory story={frontPage.leadStory} />
        <SecondaryStoryRow stories={frontPage.secondaryStories.slice(0, 2)} />
        <EditionFooter pageNumber={frontPage.pageNumber} />
      </div>
    </EditionPaper>
  );

  return embedded ? content : <EditionShell>{content}</EditionShell>;
}
