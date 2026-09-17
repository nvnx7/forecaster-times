import { Separator } from "@/components/ui/separator";
import type { SectionBrief } from "@/types";

function formatProbability(probability: number) {
  return `${Math.round(probability * 100)}¢`;
}

function formatChange(change: number) {
  return `${change >= 0 ? "+" : ""}${Math.round(change * 100)} pts`;
}

function BriefColumn({
  title,
  briefs,
}: {
  title: string;
  briefs: SectionBrief[];
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
                {formatProbability(brief.probability)}
                {brief.change24h !== undefined
                  ? ` · ${formatChange(brief.change24h)}`
                  : ""}
              </p>
            ) : null}
          </article>
        ))}
      </div>
    </section>
  );
}

export function SectionBriefs({ briefs }: { briefs: SectionBrief[] }) {
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
