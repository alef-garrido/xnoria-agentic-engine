"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { TOAST_DURATION_MS } from "@/lib/constants";

interface Toast {
  id: string;
  message: string;
  type: "success" | "error";
}

interface ToastContextValue {
  toast: (message: string, type?: "success" | "error") => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const toast = useCallback((message: string, type: "success" | "error" = "success") => {
    const id = crypto.randomUUID();
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, TOAST_DURATION_MS);
  }, []);

  const value = useMemo(() => ({ toast }), [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div
        style={{
          position: "fixed",
          top: "64px",
          right: "24px",
          zIndex: 100,
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-md)",
              backgroundColor:
                t.type === "success" ? "var(--positive-soft)" : "var(--negative-soft)",
              color: t.type === "success" ? "var(--positive)" : "var(--negative)",
              fontSize: "13px",
              fontWeight: 500,
              border: `1px solid ${t.type === "success" ? "var(--positive)" : "var(--negative)"}`,
              animation: "fadeIn 0.2s ease",
              boxShadow: "var(--shadow-md)",
            }}
          >
            {t.message}
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within a ToastProvider");
  return ctx;
}
