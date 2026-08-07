"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";
import { ToggleSwitch } from "@/components/ui/ToggleSwitch";
import { useTranslations } from "next-intl";

export function ThemeToggle({ className = "" }: { className?: string }) {
  const { theme, toggleTheme } = useTheme();
  const t = useTranslations("topbar");
  const isDark = theme === "dark";

  return (
    <div className={`flex items-center gap-1.5 ${className}`}>
      <Sun
        aria-hidden
        className={`w-3.5 h-3.5 transition-colors ${
          isDark ? "text-[var(--text-muted)]" : "text-[var(--accent)]"
        }`}
      />
      <ToggleSwitch
        checked={isDark}
        onChange={toggleTheme}
        activeColor="var(--accent)"
        ariaLabel={isDark ? t("themeToLight") : t("themeToDark")}
      />
      <Moon
        aria-hidden
        className={`w-3.5 h-3.5 transition-colors ${
          isDark ? "text-[var(--accent)]" : "text-[var(--text-muted)]"
        }`}
      />
    </div>
  );
}
