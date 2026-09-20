import { StoryBody } from "@/components/edition/story-body";
import { StoryIllustration } from "@/components/edition/story-illustration";
import type { SectionStory } from "@/types";

export function SectionLeadStory({ story }: { story: SectionStory }) {
  const wideIllustration =
    story.illustration?.placement === "wide" ? story.illustration : undefined;

  return (
    <article
      aria-labelledby={`section-lead-${story.id}`}
      className="flex flex-col gap-5"
    >
      <header className="flex flex-col items-center gap-2 text-center">
        {story.kicker ? (
          <p className="font-sans text-xs font-semibold tracking-[0.16em] text-destructive uppercase">
            {story.kicker}
          </p>
        ) : null}
        <h1
          id={`section-lead-${story.id}`}
          className="max-w-6xl font-heading text-5xl leading-[0.9] font-bold tracking-[-0.03em] md:text-7xl"
        >
          {story.headline.long}
        </h1>
        {story.dek ? (
          <p className="max-w-6xl font-sans text-xl leading-7 font-semibold italic text-muted-foreground md:text-2xl md:leading-8">
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
