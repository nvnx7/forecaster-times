import { Fragment } from "react";

import { Separator } from "@/components/ui/separator";
import type { Brief } from "@/types";
import { capitalizeWords } from "@/utils/text";

function formatCategory(category: Brief["category"]): string {
  return category.replaceAll("-", " ");
}

function formatProbability(probability: number): string {
  return `YES ${Math.round(probability * 100)}%`;
}

function formatChange(change: number): string {
  const direction = change >= 0 ? "▲" : "▼";
  return `${direction} ${Math.round(Math.abs(change) * 100)} pts`;
}

function FrontPageBrief({ brief }: { brief: Brief }) {
  return (
    <article
      aria-labelledby={`front-page-brief-${brief.id}`}
      className="flex min-w-0 flex-col gap-1.5"
    >
      <p className="font-sans text-[0.625rem] font-semibold tracking-[0.14em] text-destructive uppercase">
        {formatCategory(brief.category)}
      </p>
      <h3
        id={`front-page-brief-${brief.id}`}
        className="font-heading text-xl leading-[0.98] font-semibold tracking-[-0.01em]"
      >
        {capitalizeWords(brief.headline)}
      </h3>
      {brief.summary ? (
        <p className="line-clamp-2 font-sans text-sm leading-5 text-muted-foreground">
          {brief.summary}
        </p>
      ) : null}
      {brief.probability !== undefined ? (
        <p className="mt-0.5 font-sans text-xs font-semibold tabular-nums tracking-[0.04em] uppercase">
          {formatProbability(brief.probability)}
          {brief.change24h !== undefined
            ? ` · ${formatChange(brief.change24h)}`
            : ""}
        </p>
      ) : null}
    </article>
  );
}

export function FrontPageBriefs({ briefs }: { briefs: Brief[] }) {
  const visibleBriefs = briefs.slice(0, 3);

  if (visibleBriefs.length === 0) {
    return null;
  }

  return (
    <section
      aria-labelledby="front-page-briefs-title"
      className="flex flex-col gap-4"
    >
      <Separator tone="ink" />
      <h2
        id="front-page-briefs-title"
        className="font-heading text-lg font-semibold tracking-[0.08em] uppercase"
      >
        News in Brief
      </h2>
      <div className="grid gap-4 lg:grid-cols-[1fr_auto_1fr_auto_1fr] lg:gap-5">
        {visibleBriefs.map((brief, index) => (
          <Fragment key={brief.id}>
            <FrontPageBrief brief={brief} />
            {index < visibleBriefs.length - 1 ? (
              <>
                <Separator className="lg:hidden" />
                <Separator className="hidden lg:block" orientation="vertical" />
              </>
            ) : null}
          </Fragment>
        ))}
      </div>
    </section>
  );
}
