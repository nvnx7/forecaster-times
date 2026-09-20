import { Separator } from "@/components/ui/separator";
import {
  formatChangeInPoints,
  formatProbabilityAsCents,
} from "@/lib/market-format";
import type { CategoryBrief } from "@/types";

// Compact editorial items supporting the category-page lower grid.

function BriefColumn({
  title,
  briefs,
}: {
  title: string;
  briefs: CategoryBrief[];
}) {
  return (
    <section className="flex flex-col gap-3" aria-label={title}>
      <h2 className="font-heading text-xl font-semibold tracking-[0.04em] uppercase">
        {title}
      </h2>
      <div className="flex flex-col gap-4">
        {briefs.map((brief) => (
          <article key={brief.id} className="flex flex-col gap-1">
            {brief.kicker ? (
              <p className="font-sans text-[0.625rem] font-semibold tracking-[0.12em] text-destructive uppercase">
                {brief.kicker}
              </p>
            ) : null}
            <h3 className="font-heading text-2xl leading-[0.98] font-semibold">
              {brief.headline}
            </h3>
            {brief.summary ? (
              <p className="font-sans text-base leading-5 text-muted-foreground">
                {brief.summary}
              </p>
            ) : null}
            {brief.probability !== undefined ? (
              <p className="font-sans text-sm font-semibold tracking-[0.04em] uppercase">
                {formatProbabilityAsCents(brief.probability)}
                {brief.change24h !== undefined
                  ? ` · ${formatChangeInPoints(brief.change24h)}`
                  : ""}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function CategoryBriefs({ briefs }: { briefs: CategoryBrief[] }) {
  const splitPoint = Math.ceil(briefs.length / 2);
  const firstBriefs = briefs.slice(0, splitPoint);
  const secondBriefs = briefs.slice(splitPoint);

  return (
    <div className="grid gap-5 lg:grid-cols-[1fr_auto_1fr]">
      <BriefColumn title="Briefs" briefs={firstBriefs} />
      <Separator className="hidden lg:block" orientation="vertical" />
      <BriefColumn title="More Briefs" briefs={secondBriefs} />
    </div>
  );
}
