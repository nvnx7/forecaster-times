import { CompactMarketQuote } from "@/components/edition/compact-market-quote";
import { Separator } from "@/components/ui/separator";
import type { Story } from "@/types";
import { capitalizeWords } from "@/utils/text";

function SecondaryStory({ story }: { story: Story }) {
  const openingParagraph = story.body.find(
    (block) => block.type === "paragraph",
  );

  return (
    <article
      aria-labelledby={`secondary-story-${story.id}`}
      className="flex flex-col gap-2"
    >
      {story.kicker ? (
        <p className="font-sans text-xs font-semibold tracking-[0.14em] text-destructive uppercase">
          {story.kicker}
        </p>
      ) : null}
      <h2
        id={`secondary-story-${story.id}`}
        className="font-heading text-3xl leading-[0.95] font-semibold tracking-[-0.02em] md:text-4xl"
      >
        {capitalizeWords(story.headline.medium)}
      </h2>
      {story.dek ? (
        <p className="font-sans text-lg leading-6 italic text-muted-foreground">
          {story.dek}
        </p>
      ) : null}
      {openingParagraph?.type === "paragraph" ? (
        <p className="font-sans text-base leading-6">{openingParagraph.text}</p>
      ) : null}
      {story.market ? <CompactMarketQuote market={story.market} /> : null}
    </article>
  );
}

export function SecondaryStoryRow({ stories }: { stories: Story[] }) {
  const [firstStory, secondStory] = stories;

  if (!firstStory) {
    return null;
  }

  return (
    <section
      aria-label="More front page stories"
      className="flex flex-col gap-4"
    >
      <Separator tone="ink" />
      <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
        <SecondaryStory story={firstStory} />
        {secondStory ? (
          <>
            <Separator className="hidden lg:block" orientation="vertical" />
            <SecondaryStory story={secondStory} />
          </>
        ) : null}
      </div>
    </section>
  );
}
