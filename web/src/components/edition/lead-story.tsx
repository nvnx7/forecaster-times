import { StoryBody } from "@/components/edition/story-body";
import { StoryIllustration } from "@/components/edition/story-illustration";
import type { Story } from "@/types";

export function LeadStory({ story }: { story: Story }) {
  const wideIllustration =
    story.illustration?.placement === "wide" ? story.illustration : undefined;

  return (
    <article
      aria-labelledby={`story-${story.id}`}
      className="flex flex-col gap-5"
    >
      <header className="grid grid-cols-12 gap-x-5 gap-y-2">
        {story.kicker ? (
          <p className="col-span-12 font-sans text-xs font-semibold tracking-[0.14em] text-destructive uppercase">
            {story.kicker}
          </p>
        ) : null}
        <h2
          id={`story-${story.id}`}
          className="col-span-12 font-heading text-5xl leading-[0.9] font-bold tracking-[-0.03em] md:text-7xl"
        >
          {story.headline.long}
        </h2>
        {story.dek ? (
          <p className="col-span-12 max-w-4xl font-sans text-xl leading-7 font-semibold italic text-muted-foreground md:text-2xl md:leading-8">
            {story.dek}
          </p>
        ) : null}
      </header>
      {wideIllustration ? (
        <StoryIllustration illustration={wideIllustration} />
      ) : null}
      <StoryBody story={story} />
    </article>
  );
}
