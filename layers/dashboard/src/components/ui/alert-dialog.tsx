"use client";

import React, { useEffect } from "react";
import { cn } from "@/lib/utils";

interface AlertDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

export function AlertDialog({ open, onOpenChange, children }: AlertDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onOpenChange(false);
      }}
    >
      {children}
    </div>
  );
}

export function AlertDialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "w-full max-w-md rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] p-6 text-[var(--text-primary)] shadow-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function AlertDialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function AlertDialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-bold", className)}>{children}</h2>;
}

export function AlertDialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("mt-1 text-sm text-[var(--text-muted)]", className)}>{children}</p>;
}

export function AlertDialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)}>{children}</div>;
}

export function AlertDialogCancel({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-medium text-[var(--text-primary)] hover:bg-[var(--surface-hover)] cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}

export function AlertDialogAction({ className, children, onClick }: { className?: string; children: React.ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex h-9 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-medium text-white hover:bg-red-500 cursor-pointer",
        className
      )}
    >
      {children}
    </button>
  );
}
