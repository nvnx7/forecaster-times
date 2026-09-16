import { EditionShell } from "@/components/edition/edition-shell";
import { HotMarketsTicker } from "@/components/edition/hot-markets-ticker";
import { MarketCategoryNavigation } from "@/components/edition/market-category-navigation";
import { Masthead } from "@/components/edition/masthead";

export function FrontPage() {
  return (
    <EditionShell>
      <div className="flex flex-col gap-3 px-3 py-4 md:px-5 md:py-6">
        <Masthead />
        <HotMarketsTicker />
        <MarketCategoryNavigation />
      </div>
    </EditionShell>
  );
}
