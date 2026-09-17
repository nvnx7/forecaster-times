"use client";

import { useGetWorldPoliticsPage } from "@/api/getWorldPoliticsPage";
import { EditionFooter } from "@/components/edition/edition-footer";
import { EditionPaper, EditionShell } from "@/components/edition/edition-shell";
import { InteriorPageHeader } from "@/components/edition/interior-page-header";
import { SectionBriefs } from "@/components/edition/section-briefs";
import { SectionLeadStory } from "@/components/edition/section-lead-story";
import { SectionMarketBoard } from "@/components/edition/section-market-board";
import { SectionSecondaryStoryRow } from "@/components/edition/section-secondary-story-row";
import { SectionSidebar } from "@/components/edition/section-sidebar";
import { Separator } from "@/components/ui/separator";

export function WorldPoliticsPage({
  embedded = false,
}: {
  embedded?: boolean;
}) {
  const { data: page } = useGetWorldPoliticsPage();

  if (!page) {
    return null;
  }

  const content = (
    <EditionPaper>
      <div className="flex flex-col gap-5 px-3 py-4 md:px-5 md:py-6">
        <InteriorPageHeader
          pageNumber={page.pageNumber}
          sectionName={page.section.label}
        />
        <SectionLeadStory story={page.leadStory} />
        <SectionSecondaryStoryRow stories={page.secondaryStories.slice(0, 2)} />
        <Separator tone="ink" />
        <div className="grid gap-5 lg:grid-cols-[minmax(0,2fr)_auto_minmax(16rem,0.85fr)]">
          <SectionBriefs briefs={page.briefs} />
          {page.sidebar ? (
            <Separator className="hidden lg:block" orientation="vertical" />
          ) : null}
          {page.sidebar ? <SectionSidebar sidebar={page.sidebar} /> : null}
        </div>
        {page.marketBoard ? (
          <SectionMarketBoard board={page.marketBoard} />
        ) : null}
        <EditionFooter
          pageNumber={page.pageNumber}
          sectionName={page.section.label}
        />
      </div>
    </EditionPaper>
  );

  return embedded ? content : <EditionShell>{content}</EditionShell>;
}
