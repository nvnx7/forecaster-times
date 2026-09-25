"use client";

import { cn } from "cn";
import type * as React from "react";
import * as RechartsPrimitive from "recharts";

const initialDimension = { width: 320, height: 200 } as const;

export type ChartConfig = Record<
  string,
  { label?: React.ReactNode; color?: string }
>;

function ChartContainer({
  className,
  children,
  config,
  initialDimension: dimensions = initialDimension,
  style,
  ...props
}: React.ComponentProps<"div"> & {
  config: ChartConfig;
  children: React.ComponentProps<
    typeof RechartsPrimitive.ResponsiveContainer
  >["children"];
  initialDimension?: { width: number; height: number };
}) {
  const colors = Object.fromEntries(
    Object.entries(config)
      .filter(([, item]) => item.color)
      .map(([key, item]) => [`--color-${key}`, item.color]),
  );

  return (
    <div
      data-slot="chart"
      className={cn(
        "flex justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-layer]:outline-hidden [&_.recharts-surface]:outline-hidden",
        className,
      )}
      style={{ ...colors, ...style } as React.CSSProperties}
      {...props}
    >
      <RechartsPrimitive.ResponsiveContainer initialDimension={dimensions}>
        {children}
      </RechartsPrimitive.ResponsiveContainer>
    </div>
  );
}

export { ChartContainer };
