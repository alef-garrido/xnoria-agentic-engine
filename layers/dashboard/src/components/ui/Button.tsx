import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "outline" | "danger";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)] hover:-translate-y-px",
  outline:
    "bg-transparent border border-[var(--border)] text-[var(--text-primary)] hover:bg-[var(--surface)] hover:border-[var(--border-strong)]",
  danger: "bg-[var(--negative-soft)] text-[var(--negative)] hover:bg-[#ff453a33]",
};

export function Button({ variant = "primary", className, ...rest }: ButtonProps) {
  return (
    <button
      className={cn(
        "px-5 py-[10px] rounded-[var(--radius-md)] inline-flex items-center justify-center gap-2 transition-all duration-150",
        variant === "primary" ? "font-semibold" : "font-medium",
        variantClasses[variant],
        className
      )}
      {...rest}
    />
  );
}
