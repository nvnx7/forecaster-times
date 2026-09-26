"use client";

import { Separator as SeparatorPrimitive } from "@base-ui/react/separator";
import { cn } from "cn";

function Separator({
  className,
  orientation = "horizontal",
  tone = "default",
  ...props
}: SeparatorPrimitive.Props & { tone?: "default" | "ink" }) {
  return (
    <SeparatorPrimitive
      data-slot="separator"
      orientation={orientation}
      className={cn(
        "shrink-0 data-horizontal:h-px data-horizontal:w-full data-vertical:w-px data-vertical:self-stretch",
        tone === "ink" ? "bg-foreground" : "bg-rule/70",
        className,
      )}
      {...props}
    />
  );
}

export { Separator };
