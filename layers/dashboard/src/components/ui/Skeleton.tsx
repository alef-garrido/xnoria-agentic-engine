import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {
  /** Background token. Defaults to the elevated surface used by most skeletons. */
  variant?: "elevated" | "card";
}

export function Skeleton({ className, style, variant = "elevated", ...rest }: SkeletonProps) {
  return (
    <div
      className={cn("animate-pulse", className)}
      style={{
        backgroundColor: variant === "elevated" ? "var(--card-elevated)" : "var(--card)",
        ...style,
      }}
      {...rest}
    />
  );
}
