"use client";

import { AllowlistManager } from "@/components/AllowlistManager";
import { ListChecks } from "lucide-react";

export default function AllowlistPage() {
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
          <ListChecks
            className="w-7 h-7 inline-block mr-2"
            style={{ color: "var(--accent)", verticalAlign: "text-bottom" }}
          />
          Action Registry
        </h1>
        <p style={{ color: "var(--text-secondary)", fontSize: "14px" }}>
          Manage permitted actions — enable, disable, and configure HITL requirements
        </p>
      </div>

      {/* Manager */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--card)",
          border: "1px solid var(--border)",
        }}
      >
        <AllowlistManager />
      </div>
    </div>
  );
}
