import type { ReactNode } from "react";

import { Separator } from "@/components/ui/separator";
import type { CategorySidebar as CategorySidebarData } from "@/types";
import {
  formatChangeInPoints,
  formatProbabilityAsCents,
} from "@/utils/market-format";

// Category-specific odds furniture for the right-hand newspaper rail.

function SidebarFrame({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <aside className="flex flex-col gap-3" aria-label={title}>
      <h2 className="font-heading text-xl font-semibold tracking-[0.04em] uppercase">
        {title}
      </h2>
      <Separator />
      <dl className="flex flex-col gap-3">{children}</dl>
    </aside>
  );
}

function SidebarItem({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="font-sans text-sm leading-5 font-semibold">{label}</dt>
      <dd className="font-sans text-sm tracking-[0.04em] text-muted-foreground">
        {children}
      </dd>
    </div>
  );
}

export function CategorySidebar({ sidebar }: { sidebar: CategorySidebarData }) {
  if (sidebar.type === "text") {
    return (
      <aside className="flex flex-col gap-3" aria-label={sidebar.title}>
        <h2 className="font-heading text-xl font-semibold tracking-[0.04em] uppercase">
          {sidebar.title}
        </h2>
        <Separator />
        <p className="font-sans text-base leading-6">{sidebar.body}</p>
      </aside>
    );
  }

  if (sidebar.type === "changes") {
    return (
      <SidebarFrame title={sidebar.title}>
        {sidebar.items.map((item) => (
          <SidebarItem key={item.id} label={item.label}>
            {formatProbabilityAsCents(item.previousProbability)} →{" "}
            {formatProbabilityAsCents(item.probability)} ·{" "}
            {formatChangeInPoints(item.change)}
          </SidebarItem>
        ))}
      </SidebarFrame>
    );
  }

  if (sidebar.type === "movers") {
    return (
      <SidebarFrame title={sidebar.title}>
        {sidebar.items.map((item) => (
          <SidebarItem key={item.id} label={item.label}>
            {formatProbabilityAsCents(item.probability)} ·{" "}
            {formatChangeInPoints(item.change24h)}
          </SidebarItem>
        ))}
      </SidebarFrame>
    );
  }

  return (
    <SidebarFrame title={sidebar.title}>
      {sidebar.items.map((item) => (
        <SidebarItem key={item.id} label={item.label}>
          {formatProbabilityAsCents(item.probability)}
        </SidebarItem>
      ))}
    </SidebarFrame>
  );
}
