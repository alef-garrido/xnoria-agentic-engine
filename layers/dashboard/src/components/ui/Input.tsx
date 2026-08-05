import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

/** Shared styling for inputs, selects and textareas (formerly the `.input` CSS class). */
export const inputClass =
  "bg-[var(--surface-elevated)] border border-[var(--border)] rounded-[var(--radius-md)] px-4 py-3 text-[14px] text-[var(--text-primary)] transition-all duration-150 placeholder:text-[var(--text-muted)] focus:outline-none focus:border-[var(--accent)] focus:bg-[var(--surface-hover)]";

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cn(inputClass, className)} {...rest} />;
}
