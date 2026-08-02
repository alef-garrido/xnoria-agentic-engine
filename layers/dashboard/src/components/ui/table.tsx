"use client";

import React from "react";
import { cn } from "@/lib/utils";

export function Table({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <table className={cn("w-full text-sm text-[var(--text-primary)]", className)}>{children}</table>
  );
}

export function TableHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <thead className={className}>{children}</thead>;
}

export function TableBody({ className, children }: { className?: string; children: React.ReactNode }) {
  return <tbody className={className}>{children}</tbody>;
}

export function TableRow({ className, children, ...props }: React.HTMLAttributes<HTMLTableRowElement>) {
  return <tr className={cn("border-b border-[var(--border)] last:border-0", className)} {...props}>{children}</tr>;
}

export function TableHead({ className, children }: { className?: string; children: React.ReactNode }) {
  return <th className={cn("px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-[var(--text-secondary)]", className)}>{children}</th>;
}

export function TableCell({ className, children }: { className?: string; children: React.ReactNode }) {
  return <td className={cn("px-3 py-2.5 align-middle", className)}>{children}</td>;
}
