import { Separator } from "@/components/ui/separator";

export function InteriorPageHeader({
  pageNumber,
  categoryName,
}: {
  pageNumber: number;
  categoryName: string;
}) {
  return (
    <header className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between font-sans text-sm font-semibold tracking-[0.12em] uppercase">
        <p>{categoryName}</p>
        <p className="font-heading text-lg leading-none">{pageNumber}</p>
      </div>
      <Separator tone="ink" />
    </header>
  );
}
