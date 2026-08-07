"use client";

import React, { createContext, useContext, useEffect, useRef, useState } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface SelectCtx {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  open: boolean;
  setOpen: (open: boolean) => void;
  registerLabel: (value: string, label: string) => void;
  getLabel: (value?: string) => string | undefined;
}

const Ctx = createContext<SelectCtx | null>(null);

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  disabled?: boolean;
  children: React.ReactNode;
}

export function Select({ value, onValueChange, disabled, children }: SelectProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const labelsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  const registerLabel = (v: string, label: string) => {
    labelsRef.current[v] = label;
  };

  const getLabel = (v?: string) => (v !== undefined ? labelsRef.current[v] : undefined);

  return (
    <Ctx.Provider
      value={{ value, onValueChange, disabled, open, setOpen, registerLabel, getLabel }}
    >
      <div ref={ref} className="relative inline-block w-full">
        {children}
      </div>
    </Ctx.Provider>
  );
}

export function SelectTrigger({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SelectTrigger must be used within Select");
  return (
    <button
      type="button"
      disabled={ctx.disabled}
      onClick={() => ctx.setOpen(!ctx.open)}
      className={cn(
        "inline-flex h-9 w-full items-center justify-between gap-2 rounded-lg border border-[var(--border)] bg-[var(--card)] px-3 text-sm text-[var(--text-primary)] outline-none transition-colors hover:border-[var(--border-strong)] disabled:opacity-50 cursor-pointer",
        className
      )}
    >
      {children}
      <ChevronDown className="h-4 w-4 shrink-0 text-[var(--text-muted)]" />
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SelectValue must be used within Select");
  const label = ctx.getLabel(ctx.value);
  return <span className="truncate text-left">{label ?? (ctx.value || placeholder)}</span>;
}

export function SelectContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SelectContent must be used within Select");
  if (!ctx.open) return null;
  return (
    <div
      className={cn(
        "absolute z-50 mt-1 max-h-60 w-full min-w-[10rem] overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card-elevated)] p-1 shadow-2xl",
        className
      )}
    >
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("SelectItem must be used within Select");
  const isSelected = ctx.value === value;

  useEffect(() => {
    ctx.registerLabel(value, typeof children === "string" ? children : value);
  });

  return (
    <button
      type="button"
      onClick={() => {
        ctx.onValueChange?.(value);
        ctx.setOpen(false);
      }}
      className={cn(
        "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-sm text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] cursor-pointer",
        isSelected && "bg-[var(--accent-soft)] text-[var(--text-primary)]",
        className
      )}
    >
      {children}
    </button>
  );
}
