"use client";

import { BRANDING } from "@/config/branding";

export function TopBar() {
  return (
    <>
      <div
        className="top-bar"
        style={{
          position: "fixed",
          top: 0,
          left: "256px", // Width of sidebar (16rem = 256px)
          right: 0,
          height: "48px",
          backgroundColor: "var(--surface)",
          borderBottom: "1px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "0 20px",
          zIndex: 45,
        }}
      >
        <div className="flex items-center gap-3">
          <span style={{ fontSize: "20px" }}>🧠</span>
          <h1
            style={{
              fontFamily: "var(--font-heading)",
              fontSize: "16px",
              fontWeight: 700,
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            {BRANDING.agentName}
          </h1>
          {BRANDING.subtitle && (
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "10px",
                fontWeight: 500,
                color: "var(--text-muted)",
                padding: "2px 6px",
                backgroundColor: "var(--surface-elevated)",
                borderRadius: "4px",
                border: "1px solid var(--border)",
              }}
            >
              {BRANDING.subtitle}
            </span>
          )}
          {/* Version Badge */}
          <div
            style={{
              backgroundColor: "var(--accent-soft)",
              borderRadius: "4px",
              padding: "2px 8px",
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "9px",
                fontWeight: 700,
                color: "var(--accent)",
                letterSpacing: "1px",
              }}
            >
              v1.0
            </span>
          </div>
        </div>

        {/* Right: User */}
        <div className="flex items-center gap-3">
          {/* User Area */}
          <div className="flex items-center gap-2">
            {/* Avatar */}
            <div
              style={{
                width: "28px",
                height: "28px",
                borderRadius: "14px",
                backgroundColor: "var(--accent)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  fontFamily: "var(--font-heading)",
                  fontSize: "12px",
                  fontWeight: 700,
                  color: "var(--text-primary)",
                }}
              >
                X
              </span>
            </div>
            <span
              style={{
                fontFamily: "var(--font-body)",
                fontSize: "12px",
                fontWeight: 500,
                color: "var(--text-secondary)",
              }}
            >
              Admin
            </span>
          </div>
        </div>
      </div>
    </>
  );
}
