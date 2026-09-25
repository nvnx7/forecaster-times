import { MarketQuote } from "@/components/edition/market-quote";
import { StoryIllustration } from "@/components/edition/story-illustration";
import { Separator } from "@/components/ui/separator";
import type { Illustration, MarketPanel, ParagraphBlock } from "@/types";
import { cn } from "@/utils/cn";

type ArticleStory = {
  body: ParagraphBlock[];
  byline?: string;
  market?: MarketPanel;
};

function ArticleBlock({
  block,
  isOpening = false,
}: {
  block: ParagraphBlock;
  isOpening?: boolean;
}) {
  if (block.type === "pullquote") {
    return (
      <blockquote className="article-pullquote">“{block.text}”</blockquote>
    );
  }

  if (block.type === "subheading") {
    return <h3 className="article-subheading">{block.text}</h3>;
  }

  return (
    <p
      className={cn(
        "article-paragraph",
        isOpening && "article-paragraph-opening",
      )}
    >
      {block.text}
    </p>
  );
}

export function StoryBody({
  story,
  illustration,
}: {
  story: ArticleStory;
  illustration?: Illustration;
}) {
  const [openingBlock, ...remainingBlocks] = story.body;
  const sideMarket =
    story.market?.placement !== "full-width" ? story.market : undefined;

  if (illustration || sideMarket) {
    return (
      <div className="article-flow">
        {illustration ? (
          <div
            className={cn(
              "article-float-illustration",
              illustration.placement === "float-right"
                ? "article-float-right"
                : "article-float-left",
            )}
          >
            <StoryIllustration illustration={illustration} />
          </div>
        ) : null}
        {sideMarket ? (
          <div className="article-float-market article-float-right">
            <MarketQuote market={sideMarket} />
          </div>
        ) : null}
        {openingBlock ? <ArticleBlock block={openingBlock} isOpening /> : null}
        {remainingBlocks.map((block) => (
          <ArticleBlock key={`${block.type}-${block.text}`} block={block} />
        ))}
        {story.byline ? (
          <>
            <Separator />
            <p className="article-byline font-sans text-sm font-semibold tracking-[0.08em] text-muted-foreground uppercase">
              By {story.byline}
            </p>
          </>
        ) : null}
      </div>
    );
  }

  return (
    <div className="article-body-layout">
      {story.market?.placement === "full-width" ? (
        <div className="article-market-full-width">
          <MarketQuote market={story.market} />
        </div>
      ) : null}
      <div className="article-columns">
        {openingBlock ? <ArticleBlock block={openingBlock} isOpening /> : null}
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
    </div>
  );
}
