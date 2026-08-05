"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Terminal, Lock, User, AlertCircle, KeyRound } from "lucide-react";
import { BRANDING } from "@/config/branding";
import { useTranslations } from "next-intl";

function LoginForm() {
  const t = useTranslations("login");
  const [handle, setHandle] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ handle, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // If the operator has never changed their password, redirect to change-password page
        if (data.requires_password_change) {
          router.push("/change-password");
          return;
        }
        const from = searchParams.get("from") || "/";
        router.push(from);
        router.refresh();
      } else if (res.status === 423) {
        setError(t("locked"));
      } else if (res.status === 401) {
        setError(t("invalidCredentials"));
      } else {
        setError(data.error ?? t("loginFailed"));
      }
    } catch {
      setError(t("connectionError"));
    }

    setLoading(false);
  };

  return (
    <div
      className="rounded-xl p-10"
      style={{
        backgroundColor: "var(--card)",
        border: "1px solid var(--border)",
      }}
    >
      {/* Header */}
      <div className="text-center mb-8 flex flex-col items-center gap-2">
        <div className="flex items-center gap-2.5">
          <Terminal className="w-7 h-7" style={{ color: "var(--accent)" }} />
          <span className="text-2xl">🧠</span>
          <h1
            className="text-xl font-bold"
            style={{
              fontFamily: "var(--font-heading)",
              color: "var(--text-primary)",
              letterSpacing: "-0.5px",
            }}
          >
            {BRANDING.agentName}
          </h1>
        </div>
        <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
          {t("subtitle")}
        </p>{" "}
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Handle */}
        <div className="relative">
          <User
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="text"
            id="handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value.toLowerCase().trim())}
            className="w-full pl-11 pr-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            placeholder={t("username")}
            autoComplete="username"
            required
          />
        </div>

        {/* Password */}
        <div className="relative">
          <Lock
            className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px]"
            style={{ color: "var(--text-muted)" }}
          />
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full pl-11 pr-4 py-3 rounded-lg text-sm"
            style={{
              backgroundColor: "var(--card-elevated)",
              border: "1px solid var(--border)",
              color: "var(--text-primary)",
            }}
            placeholder={t("password")}
            autoComplete="current-password"
            required
          />
        </div>

        {error && (
          <div
            className="flex items-center gap-2 text-sm px-4 py-3 rounded-lg"
            style={{
              backgroundColor: "var(--negative-soft)",
              color: "var(--negative)",
            }}
          >
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full font-semibold py-2.5 px-4 rounded-lg transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
          style={{
            backgroundColor: "var(--accent)",
            color: "white",
          }}
        >
          <KeyRound className="w-4 h-4" />
          {loading ? t("checking") : t("signIn")}
        </button>
      </form>

      {/* Footer */}
      <p className="text-center text-xs mt-6" style={{ color: "var(--text-muted)" }}>
        {BRANDING.agentName} CX Intelligence Engine
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 -ml-64"
      style={{ backgroundColor: "var(--background)" }}
    >
      <div className="w-full max-w-md">
        <Suspense
          fallback={
            <div
              className="rounded-xl p-10 animate-pulse"
              style={{
                backgroundColor: "var(--card)",
                border: "1px solid var(--border)",
              }}
            >
              <div className="h-8 bg-gray-700 rounded mb-6" />
              <div className="h-12 bg-gray-700 rounded mb-4" />
              <div className="h-12 bg-gray-700 rounded mb-4" />
              <div className="h-10 bg-gray-700 rounded" />
            </div>
          }
        >
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}
