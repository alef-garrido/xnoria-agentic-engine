"use client";

import React, { createContext, useContext, useState } from "react";
import { cn } from "@/lib/utils";

interface TabsCtx {
  value: string;
  onValueChange: (value: string) => void;
}

const Ctx = createContext<TabsCtx | null>(null);

interface TabsProps {
  defaultValue: string;
  className?: string;
  children: React.ReactNode;
}

export function Tabs({ defaultValue, className, children }: TabsProps) {
  const [value, setValue] = useState(defaultValue);
  return (
    <Ctx.Provider value={{ value, onValueChange: setValue }}>
      <div className={cn("w-full", className)}>{children}</div>
    </Ctx.Provider>
  );
}

export function TabsList({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <div className={cn("inline-flex gap-1 rounded-lg border border-[var(--border)] bg-[var(--card)] p-1", className)}>
      {children}
    </div>
  );
}

export function TabsTrigger({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TabsTrigger must be used within Tabs");
  const isActive = ctx.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx.onValueChange(value)}
      className={cn(
        "rounded-md px-3 py-1.5 text-sm font-medium transition-colors cursor-pointer",
        isActive
          ? "bg-[var(--accent)] text-white"
          : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]",
        className
      )}
    >
      {children}
    </button>
  );
}

export function TabsContent({ value, className, children }: { value: string; className?: string; children: React.ReactNode }) {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("TabsContent must be used within Tabs");
  if (ctx.value !== value) return null;
  return <div className={cn("mt-6", className)}>{children}</div>;
}
