import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Card({ className, style, ...rest }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("rounded-xl overflow-hidden", className)}
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)", ...style }}
      {...rest}
    />
  );
}
