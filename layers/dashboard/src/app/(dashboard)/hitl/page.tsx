"use client";

import { HITLQueue } from "@/components/HITLQueue";
import { ShieldCheck } from "lucide-react";

export default function HITLPage() {
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
          <ShieldCheck
            className="w-7 h-7 inline-block mr-2"
            style={{ color: "var(--warning)", verticalAlign: "text-bottom" }}
          />
          Approval Queue
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Actions flagged for human review — approve or reject before execution
        </p>
      </div>

      {/* Queue */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <HITLQueue />
      </div>
    </div>
  );
}
