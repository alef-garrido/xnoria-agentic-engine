"use client";

import React, { createContext, useContext, useEffect } from "react";
import { cn } from "@/lib/utils";

interface DialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
}

const DialogCtx = createContext<{ onOpenChange: (open: boolean) => void } | null>(null);

export function Dialog({ open, onOpenChange, children }: DialogProps) {
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
    <DialogCtx.Provider value={{ onOpenChange }}>
      <div
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
        onMouseDown={(e) => {
          if (e.target === e.currentTarget) onOpenChange(false);
        }}
      >
        {children}
      </div>
    </DialogCtx.Provider>
  );
}

export function DialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div
      className={cn(
        "w-full max-w-lg rounded-xl border border-[var(--border)] bg-[var(--card-elevated)] p-6 text-[var(--text-primary)] shadow-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function DialogHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mb-4", className)}>{children}</div>;
}

export function DialogTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return <h2 className={cn("text-lg font-bold", className)}>{children}</h2>;
}

export function DialogDescription({ className, children }: { className?: string; children: React.ReactNode }) {
  return <p className={cn("mt-1 text-sm text-[var(--text-muted)]", className)}>{children}</p>;
}

export function DialogFooter({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)}>{children}</div>;
}

export function useDialogClose() {
  const ctx = useContext(DialogCtx);
  if (!ctx) throw new Error("useDialogClose must be used within Dialog");
  return ctx;
}
