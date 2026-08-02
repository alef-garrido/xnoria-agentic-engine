"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface SliderProps {
  value: number[];
  onValueChange: (value: number[]) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function Slider({ value, onValueChange, min = 0, max = 100, step = 1, className }: SliderProps) {
  const current = value[0] ?? min;
  const pct = max > min ? ((current - min) / (max - min)) * 100 : 0;

  return (
    <input
      type="range"
      min={min}
      max={max}
      step={step}
      value={current}
      onChange={(e) => onValueChange([parseFloat(e.target.value)])}
      className={cn("h-2 w-full cursor-pointer accent-[var(--accent)]", className)}
      style={{
        background: `linear-gradient(to right, var(--accent) ${pct}%, var(--border) ${pct}%)`,
      }}
    />
  );
}
