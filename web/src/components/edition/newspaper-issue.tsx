"use client";

import { CategoryPage } from "@/components/edition/category-page";
import { EditionShell } from "@/components/edition/edition-shell";
import { FrontPage } from "@/components/edition/front-page";

export function NewspaperIssue() {
  return (
    <EditionShell>
      <div className="flex flex-col gap-3 md:gap-5">
        <FrontPage embedded />
        <CategoryPage embedded />
      </div>
    </EditionShell>
  );
}
