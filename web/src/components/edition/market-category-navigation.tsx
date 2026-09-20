"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { marketCategories } from "@/config/categories";

const navigationCategories = [
  { id: "front-page", label: "Front Page" },
  ...marketCategories,
] as const;

const activeMarketCategoryId = "front-page";

function handleCategorySelect() {}

export function MarketCategoryNavigation() {
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
              {navigationCategories.map((category) => (
                <Button
                  key={category.id}
                  type="button"
                  variant={
                    category.id === activeMarketCategoryId
                      ? "newspaperActive"
                      : "newspaper"
                  }
                  onClick={handleCategorySelect}
                  aria-current={
                    category.id === activeMarketCategoryId ? "page" : undefined
                  }
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
