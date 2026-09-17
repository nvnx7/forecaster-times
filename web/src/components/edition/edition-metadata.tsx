import { Separator } from "@/components/ui/separator";
import type { FrontPage } from "@/types";

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
          dateTime={edition.date}
        >
          {edition.displayDate}
        </time>
        {edition.editionLabel ? (
          <p className="col-span-12 text-center text-foreground md:col-span-4">
            {edition.editionLabel}
          </p>
        ) : null}
        <div className="col-span-12 flex items-center justify-between md:col-span-4">
          {edition.tagline ? <p>{edition.tagline}</p> : <span />}
          <p className="font-heading text-base leading-none text-foreground">
            {pageNumber}
          </p>
        </div>
      </div>
      <Separator />
    </section>
  );
}
