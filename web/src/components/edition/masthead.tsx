import Image from "next/image";

import { EditionDate } from "@/components/edition/edition-date";
import { Logo } from "@/components/logo";
import { Separator } from "@/components/ui/separator";

function MastheadRule() {
  return (
    <div className="flex flex-col gap-0.5" aria-hidden="true">
      <Separator tone="ink" />
      <Separator />
    </div>
  );
}

function formatEditionNumber(editionId?: number) {
  return editionId?.toString().padStart(3, "0") ?? "—";
}

function HeaderStrap({ editionId }: { editionId?: number }) {
  return (
    <p className="text-center font-sans text-[0.6875rem] font-semibold tracking-[0.14em] text-foreground uppercase">
      Probability Is a Public Record · Morning Broadsheet · Edition{" "}
      {formatEditionNumber(editionId)}
    </p>
  );
}

function LeftFolio() {
  return (
    <div className="flex flex-col gap-1 text-center lg:text-left">
      <p className="font-sans text-base font-semibold tracking-[0.04em] uppercase">
        Price: Five Cents
      </p>
      <p className="font-sans text-base italic text-muted-foreground">
        Published at first light
      </p>
      <p className="font-mono text-xs font-semibold tracking-[0.08em] text-destructive uppercase">
        Edition sealed · 08:30 GMT
      </p>
    </div>
  );
}

function Nameplate() {
  return (
    <div className="order-first flex flex-col items-center gap-3 text-center lg:order-none">
      <Logo size={56} priority />
      <h1 className="masthead-title text-5xl uppercase md:text-7xl md:whitespace-nowrap">
        Farcaster Times
      </h1>
      <p className="font-sans text-xl leading-7 italic text-muted-foreground">
        The Newspaper of What Happens Next
      </p>
    </div>
  );
}

function RightFolio() {
  return (
    <div className="flex flex-col gap-1 text-center lg:text-right">
      <EditionDate />
      <p className="font-mono text-xs font-semibold tracking-[0.08em] text-muted-foreground uppercase">
        Worldwide Edition
      </p>
    </div>
  );
}

function PublicationLine({ editionId }: { editionId?: number }) {
  return (
    <div className="grid gap-1 text-center font-sans text-[0.6875rem] font-semibold tracking-[0.13em] text-muted-foreground uppercase md:grid-cols-[1fr_auto_1fr]">
      <p className="md:text-left">
        Vol. I · No. {formatEditionNumber(editionId)}
      </p>
      <div className="flex items-center justify-center gap-1.5">
        <span>Market data by Nansen</span>
        <Image
          src="/nansen.svg"
          alt=""
          width={18}
          height={18}
          className="size-4.5 brightness-0"
        />
      </div>
      <p className="md:text-right">On Chain · Everywhere</p>
    </div>
  );
}

export function Masthead({ editionId }: { editionId?: number }) {
  return (
    <header className="flex flex-col gap-4">
      <HeaderStrap editionId={editionId} />
      <MastheadRule />
      <div className="grid items-center gap-5 py-4 lg:grid-cols-[minmax(12rem,1fr)_auto_minmax(0,2.8fr)_auto_minmax(12rem,1fr)] lg:gap-7">
        <LeftFolio />
        <Separator className="hidden lg:block" orientation="vertical" />
        <Nameplate />
        <Separator className="hidden lg:block" orientation="vertical" />
        <RightFolio />
      </div>
      <PublicationLine editionId={editionId} />
      <MastheadRule />
    </header>
  );
}
