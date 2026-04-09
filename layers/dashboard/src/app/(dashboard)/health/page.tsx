"use client";

import { JourneyHealthMap } from "@/components/JourneyHealthMap";
import { Activity } from "lucide-react";

export default function HealthPage() {
  return (
    <div className="flex flex-col gap-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold mb-1"
          style={{
            fontFamily: "var(--font-heading)",
            color: "var(--text-primary)",
            letterSpacing: "-1.5px",
          }}
        >
          <Activity
            className="w-7 h-7 inline-block mr-2"
            style={{ color: "var(--accent)", verticalAlign: "text-bottom" }}
          />
          Journey Health Map
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Operational visibility across all active journey stages — action
          volume, signal severity, and decision quality.
        </p>
      </div>

      {/* Health Map */}
      <JourneyHealthMap />
    </div>
  );
}
