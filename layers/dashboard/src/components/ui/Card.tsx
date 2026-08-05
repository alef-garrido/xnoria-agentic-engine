import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "rounded-xl overflow-hidden bg-[var(--card)] border border-[var(--border)]",
        className
      )}
      style={style}
      {...rest}
    />
  );
}
