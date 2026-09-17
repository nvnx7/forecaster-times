"use client";

import { EditionShell } from "@/components/edition/edition-shell";
import { FrontPage } from "@/components/edition/front-page";
import { WorldPoliticsPage } from "@/components/edition/section-page";

export function NewspaperIssue() {
  return (
    <EditionShell>
      <div className="flex flex-col gap-3 md:gap-5">
        <FrontPage embedded />
        <WorldPoliticsPage embedded />
      </div>
    </EditionShell>
  );
}
