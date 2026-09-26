"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import type { CategoryPageId } from "@/types";

export type EditionCategoryNavigationItem = {
  id: Exclude<CategoryPageId, "front">;
  label: string;
};

const frontPageNavigationItem = { id: "front", label: "Front Page" } as const;

export function MarketCategoryNavigation({
  categories,
  onCategorySelect,
}: {
  categories: readonly EditionCategoryNavigationItem[];
  onCategorySelect: (pageId: CategoryPageId) => void;
}) {
  return (
    <nav aria-label="Market categories" className="flex flex-col gap-2">
      <Separator />
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center py-1 md:min-w-full">
          <span className="mr-5 shrink-0 font-mono text-xs font-semibold tracking-[0.08em] text-destructive uppercase">
            Markets
          </span>
          <div className="flex min-w-0 flex-1 justify-center">
            <div className="flex shrink-0 items-center gap-x-12 px-0.5">
              {[frontPageNavigationItem, ...categories].map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant="newspaper"
                  onClick={() => onCategorySelect(category.id)}
                >
                  {category.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      <Separator />
    </nav>
  );
}
