import { Separator } from "@/components/ui/separator";

export function EditionFooter({
  pageNumber,
  sectionName,
}: {
  pageNumber: number;
  sectionName?: string;
}) {
  const sectionLabel = sectionName ? ` · ${sectionName.toUpperCase()}` : "";

  return (
    <footer className="flex flex-col gap-2 pt-2">
      <Separator />
      <p className="text-center font-sans text-[0.6875rem] font-semibold tracking-[0.13em] text-muted-foreground uppercase">
        Probability Press{sectionLabel} · Page {pageNumber}
      </p>
    </footer>
  );
}
