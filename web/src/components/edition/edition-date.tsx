type EditionDate = {
  dateLabel: string;
  timeLabel: string;
  isoDate: string;
  yearLabel: string;
};

function getEditionDate(publishedAt: string): EditionDate | undefined {
  const publishedDate = new Date(publishedAt);
  if (Number.isNaN(publishedDate.valueOf())) return undefined;

  return {
    dateLabel: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    }).format(publishedDate),
    timeLabel: new Intl.DateTimeFormat("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
      timeZone: "UTC",
      timeZoneName: "short",
    }).format(publishedDate),
    isoDate: publishedDate.toISOString(),
    yearLabel: new Intl.DateTimeFormat("en-US", {
      year: "numeric",
      timeZone: "UTC",
    }).format(publishedDate),
  };
}

export function EditionDate({ publishedAt }: { publishedAt?: string }) {
  const editionDate = publishedAt ? getEditionDate(publishedAt) : undefined;
  if (!editionDate) {
    return null;
  }

  return (
    <>
      <time
        className="font-sans text-base font-semibold tracking-[0.04em] uppercase"
        dateTime={editionDate.isoDate}
      >
        {editionDate.dateLabel}
      </time>
      <p className="font-sans text-base italic text-muted-foreground">
        {editionDate.timeLabel}
      </p>
      <p className="font-sans text-base italic text-muted-foreground">
        In the year {editionDate.yearLabel}
      </p>
    </>
  );
}
