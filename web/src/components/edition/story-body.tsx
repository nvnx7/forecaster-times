import { MarketQuote } from "@/components/edition/market-quote";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import type { Story } from "@/types";

const marketPlacementClasses = {
  "float-left": "article-market-float-left",
  "float-right": "article-market-float-right",
  "full-width": "article-market-full-width",
} as const;

function ArticleBlock({ block }: { block: Story["body"][number] }) {
  if (block.type === "pullquote") {
    return (
      <blockquote className="article-pullquote">“{block.text}”</blockquote>
    );
  }

  if (block.type === "subheading") {
    return <h3 className="article-subheading">{block.text}</h3>;
  }

  return <p className="article-paragraph">{block.text}</p>;
}

export function StoryBody({ story }: { story: Story }) {
  const [openingBlock, ...remainingBlocks] = story.body;
  const marketPlacement = story.market?.placement ?? "float-right";
  const marketClassName = marketPlacementClasses[marketPlacement];

  return (
    <div className="article-columns">
      {story.market?.placement === "full-width" ? (
        <div className={marketClassName}>
          <MarketQuote market={story.market} />
        </div>
      ) : null}
      {openingBlock ? <ArticleBlock block={openingBlock} /> : null}
      {story.market && story.market.placement !== "full-width" ? (
        <div className={cn("article-market", marketClassName)}>
          <MarketQuote market={story.market} />
        </div>
      ) : null}
      {remainingBlocks.map((block) => (
        <ArticleBlock key={`${block.type}-${block.text}`} block={block} />
      ))}
      {story.byline ? (
        <>
          <Separator />
          <p className="font-sans text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
            By {story.byline}
          </p>
        </>
      ) : null}
    </div>
  );
}
