"use client";

import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";

const marketCategories = [
  "Front Page",
  "World",
  "Politics",
  "Money",
  "Technology",
  "Crypto",
  "Sports",
  "Culture",
  "Oddities",
] as const;

const activeMarketCategory = "Front Page";

function handleCategorySelect() {}

export function MarketCategoryNavigation() {
  return (
    <nav aria-label="Market categories" className="flex flex-col gap-2">
      <Separator />
      <div className="overflow-x-auto">
        <div className="flex min-w-max items-center gap-x-5 px-0.5 py-1">
          <span className="font-mono text-xs font-semibold tracking-[0.08em] text-destructive uppercase">
            Markets
          </span>
          {marketCategories.map((category) => (
            <Button
              key={category}
              type="button"
              variant={
                category === activeMarketCategory
                  ? "newspaperActive"
                  : "newspaper"
              }
              onClick={handleCategorySelect}
              aria-current={
                category === activeMarketCategory ? "page" : undefined
              }
            >
              {category}
            </Button>
          ))}
        </div>
      </div>
      <Separator />
    </nav>
  );
}
