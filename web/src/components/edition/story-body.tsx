import { MarketQuote } from "@/components/edition/market-quote";
import { Separator } from "@/components/ui/separator";
import type { MarketPanel, ParagraphBlock } from "@/types";
import { cn } from "@/utils/cn";

type ArticleStory = {
  body: ParagraphBlock[];
  byline?: string;
  market?: MarketPanel;
};

function ArticleBlock({ block }: { block: ParagraphBlock }) {
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

export function StoryBody({ story }: { story: ArticleStory }) {
  const [openingBlock, ...remainingBlocks] = story.body;
  const hasSideMarket = Boolean(
    story.market && story.market.placement !== "full-width",
  );

  return (
    <div className={cn("article-body-layout", hasSideMarket && "has-market")}>
      {story.market?.placement === "full-width" ? (
        <div className="article-market-full-width">
          <MarketQuote market={story.market} />
        </div>
      ) : null}
      <div className="article-columns">
        {openingBlock ? <ArticleBlock block={openingBlock} /> : null}
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
      {story.market && story.market.placement !== "full-width" ? (
        <div className="article-market-aside">
          <MarketQuote market={story.market} />
        </div>
      ) : null}
    </div>
  );
}
