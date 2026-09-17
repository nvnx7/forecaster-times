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
        <div className="flex min-w-max items-center gap-x-5 px-0.5 py-1">
          <span className="font-mono text-xs font-semibold tracking-[0.08em] text-destructive uppercase">
            Markets
          </span>
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
      <Separator />
    </nav>
  );
}
