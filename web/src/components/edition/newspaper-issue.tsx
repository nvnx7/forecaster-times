"use client";

import { useGetEditionManifest } from "@/api/getEditionManifest";
import { CategoryPage } from "@/components/edition/category-page";
import { EditionShell } from "@/components/edition/edition-shell";
import { FrontPage } from "@/components/edition/front-page";

export function NewspaperIssue() {
  const { data: manifest } = useGetEditionManifest();
  const categoryPageIds = manifest?.pages.flatMap((page) =>
    page.status === "published" && page.id !== "front" ? [page.id] : [],
  );

  return (
    <EditionShell>
      <div className="flex flex-col gap-3 md:gap-5">
        <FrontPage embedded />
        {categoryPageIds?.map((categoryId) => (
          <CategoryPage key={categoryId} categoryId={categoryId} embedded />
        ))}
      </div>
    </EditionShell>
  );
}
