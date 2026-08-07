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
      <div className="fixed top-[64px] right-6 z-[100] flex flex-col gap-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="px-5 py-3 rounded-[var(--radius-md)] text-[13px] font-medium border animate-[fadeIn_0.2s_ease] shadow-[var(--shadow-md)]"
            style={{
              backgroundColor:
                t.type === "success" ? "var(--positive-soft)" : "var(--negative-soft)",
              color: t.type === "success" ? "var(--positive)" : "var(--negative)",
              borderColor: t.type === "success" ? "var(--positive)" : "var(--negative)",
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
