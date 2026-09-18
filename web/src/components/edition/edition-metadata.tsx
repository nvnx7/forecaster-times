import { Separator } from "@/components/ui/separator";
import type { FrontPage } from "@/types";

const editionLabel = "Daily Edition";
const editionTagline = "The newspaper of what happens next";

function formatEditionDate(now: string) {
  return new Intl.DateTimeFormat("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(new Date(now));
}

export function EditionMetadata({
  edition,
  pageNumber,
}: {
  edition: FrontPage["edition"];
  pageNumber: FrontPage["pageNumber"];
}) {
  return (
    <section aria-label="Edition information" className="flex flex-col gap-2">
      <Separator />
      <div className="grid grid-cols-12 items-center gap-2 font-sans text-[0.6875rem] font-semibold tracking-[0.12em] text-muted-foreground uppercase">
        <time
          className="col-span-12 md:col-span-4 md:text-left"
          dateTime={edition.now}
        >
          {formatEditionDate(edition.now)}
        </time>
        <p className="col-span-12 text-center text-foreground md:col-span-4">
          {editionLabel}
        </p>
        <div className="col-span-12 flex items-center justify-between md:col-span-4">
          <p>{editionTagline}</p>
          <p className="font-heading text-base leading-none text-foreground">
            {pageNumber}
          </p>
        </div>
      </div>
      <Separator />
    </section>
  );
}
