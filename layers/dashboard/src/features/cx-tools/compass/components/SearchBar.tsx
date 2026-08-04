"use client";

import { useState, useMemo } from "react";
import { Search } from "lucide-react";
import { useCompassData } from "@/features/cx-tools/compass/context/CompassDataContext";
import { useWheel } from "@/features/cx-tools/compass/context/WheelContext";
import type { Cause, Domain } from "@/features/cx-tools/shared/types/wheel";

interface SearchResult {
  cause: Cause;
  domain: Domain;
}

export default function SearchBar() {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const { selectDomain, selectCause } = useWheel();
  const { wheelData, uiStrings } = useCompassData();

  const results = useMemo<SearchResult[]>(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];
    for (const domain of wheelData.domains) {
      for (const cause of domain.causes) {
        let match = false;
        if (
          cause.name.toLowerCase().includes(q) ||
          cause.code.toLowerCase().includes(q)
        ) {
          match = true;
        } else {
          for (const s of cause.signals) {
            if (s.name.toLowerCase().includes(q) || s.id.toLowerCase().includes(q)) match = true;
          }
          for (const ind of cause.indicators) {
            if (ind.name.toLowerCase().includes(q) || ind.id.toLowerCase().includes(q)) match = true;
          }
        }
        if (match) {
          matches.push({ cause, domain });
        }
      }
    }
    return matches.slice(0, 8);
  }, [query, wheelData]);

  const handleSelect = (result: SearchResult) => {
    selectDomain(result.domain);
    setTimeout(() => selectCause(result.cause), 100);
    setQuery("");
  };

  return (
    <div className="relative">
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5" style={{ color: "var(--text-secondary)" }} />
        <input
          type="text"
          placeholder={uiStrings.searchPlaceholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setTimeout(() => setIsFocused(false), 200)}
          className="w-full pl-8 pr-3 py-1.5 text-xs rounded-md border bg-transparent focus:outline-none focus:ring-1"
          style={{
            borderColor: "var(--border)",
            color: "var(--text-primary)",
          }}
        />
      </div>
      {isFocused && results.length > 0 && (
        <div
          className="absolute top-full mt-1 w-full rounded-md border shadow-lg z-50 overflow-hidden"
          style={{
            backgroundColor: "var(--card-elevated)",
            borderColor: "var(--border)",
          }}
        >
          {results.map((r) => (
            <button
              key={r.cause.id}
              onMouseDown={() => handleSelect(r)}
              className="w-full text-left px-3 py-2 text-xs hover:bg-white/10 flex items-center gap-2 transition-colors"
            >
              <span className="font-mono font-bold text-[11px] shrink-0" style={{ color: r.domain.color }}>
                {r.cause.code}
              </span>
              <span className="truncate">{r.cause.name}</span>
              <span className="text-[var(--text-secondary)] ml-auto text-[10px] shrink-0">{r.domain.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
