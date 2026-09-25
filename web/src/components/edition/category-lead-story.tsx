import { StoryBody } from "@/components/edition/story-body";
import { StoryIllustration } from "@/components/edition/story-illustration";
import type { CategoryStory } from "@/types";
import { capitalizeWords } from "@/utils/text";

// The lead composition adapts between wide and portrait editorial illustrations.

export function CategoryLeadStory({ story }: { story: CategoryStory }) {
  const wideIllustration =
    story.illustration?.placement === "wide" ? story.illustration : undefined;
  const sideIllustration =
    story.illustration?.placement === "float-left" ||
    story.illustration?.placement === "float-right"
      ? story.illustration
      : undefined;

  return (
    <article
      aria-labelledby={`category-lead-${story.id}`}
      className="flex flex-col gap-5"
    >
      <header className="flex flex-col items-center gap-2 text-center">
        {story.kicker ? (
          <p className="font-sans text-xs font-semibold tracking-[0.16em] text-destructive uppercase">
            {story.kicker}
          </p>
        ) : null}
        <h1
          id={`category-lead-${story.id}`}
          className="max-w-6xl font-heading text-5xl leading-[0.9] font-bold tracking-[-0.03em] md:text-7xl"
        >
          {capitalizeWords(story.headline.long)}
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
      <StoryBody story={story} illustration={sideIllustration} />
    </article>
  );
}
