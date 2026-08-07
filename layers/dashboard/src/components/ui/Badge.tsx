import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Badge({ className, ...rest }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-[3px] rounded-[var(--radius-sm)] text-[9px] font-bold tracking-[1px] uppercase",
        className
      )}
      {...rest}
    />
  );
}
