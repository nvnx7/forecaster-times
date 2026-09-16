"use client";

import { useEffect, useState } from "react";

type EditionDate = {
  dateLabel: string;
  isoDate: string;
  yearLabel: string;
};

function getEditionDate(): EditionDate {
  const currentDate = new Date();

  return {
    dateLabel: new Intl.DateTimeFormat("en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
    }).format(currentDate),
    isoDate: currentDate.toISOString().slice(0, 10),
    yearLabel: new Intl.DateTimeFormat("en-US", { year: "numeric" }).format(
      currentDate,
    ),
  };
}

export function EditionDate() {
  const [editionDate, setEditionDate] = useState<EditionDate>();

  useEffect(() => {
    setEditionDate(getEditionDate());
  }, []);

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
        In the year {editionDate.yearLabel}
      </p>
    </>
  );
}
