"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Activity,
  Server,
  History,
  Terminal,
  LogOut,
  Menu,
  X,
  ShieldCheck,
  ListChecks,
  HeartPulse,
  BrainCog,
  Radar,
  Compass,
  LayoutGrid,
  Pencil,
} from "lucide-react";
import { BRANDING } from "@/config/branding";
import { useTranslations } from "next-intl";
import { apiFetch } from "@/lib/client-api";

export function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const t = useTranslations("sidebar");
  const tools = useTranslations("cxtools");

  const navSections = [
    {
      items: [{ href: "/", label: t("dashboard"), icon: LayoutDashboard }],
    },
    {
      label: t("cxTools"),
      items: [
        { href: "/tools/compass", label: tools("toolCompass"), icon: Compass },
        { href: "/tools/radar", label: tools("toolRadar"), icon: Radar },
        { href: "/tools/matriz", label: tools("toolMatriz"), icon: LayoutGrid },
        { href: "/tools/editor", label: tools("toolEditor"), icon: Pencil },
      ],
    },
    {
      label: t("operations"),
      items: [
        { href: "/health", label: t("health"), icon: HeartPulse },
        { href: "/hitl", label: t("approvals"), icon: ShieldCheck },
        { href: "/allowlist", label: t("allowlist"), icon: ListChecks },
        { href: "/memory", label: t("memory"), icon: BrainCog },
        { href: "/activity", label: t("activity"), icon: Activity },
        { href: "/sessions", label: t("sessions"), icon: History },
        { href: "/system", label: t("system"), icon: Server },
      ],
    },
  ];

  // Check if mobile on mount and resize
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  // Close sidebar when navigating on mobile
  useEffect(() => {
    if (isMobile) {
      setTimeout(() => setIsOpen(false), 0);
    }
  }, [pathname, isMobile]);

  // Prevent scroll when sidebar is open on mobile
  useEffect(() => {
    if (isOpen && isMobile) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen, isMobile]);

  const handleLogout = async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // Proceed to login regardless — the session may already be expired
    }
    router.push("/login");
    router.refresh();
  };

  const toggleSidebar = () => setIsOpen(!isOpen);
  const closeSidebar = () => setIsOpen(false);

  return (
    <>
      {/* Mobile hamburger button */}
      <button
        onClick={toggleSidebar}
        aria-label={t("toggleMenu")}
        className="fixed top-4 left-4 z-[60] p-2 rounded-lg bg-[var(--card)] border border-[var(--border)] text-[var(--text-primary)] items-center justify-center cursor-pointer transition-colors"
        style={{ display: isMobile ? "flex" : "none" }}
      >
        <Menu className="w-6 h-6" />
      </button>

      {/* Overlay for mobile */}
      {isMobile && (
        <div
          onClick={closeSidebar}
          className="fixed inset-0 z-40 bg-black/50"
          style={{
            opacity: isOpen ? 1 : 0,
            pointerEvents: isOpen ? "auto" : "none",
            transition: "opacity 0.3s ease",
          }}
        />
      )}

      {/* Sidebar */}
      <aside
        className="fixed left-0 top-0 w-[var(--layout-sidebar-w)] min-h-screen flex flex-col p-4 bg-[var(--card)] border-r border-[var(--border)] z-50"
        style={{
          transform: isMobile ? (isOpen ? "translateX(0)" : "translateX(-100%)") : "translateX(0)",
          transition: "transform 0.3s ease",
        }}
      >
        {/* Close button for mobile */}
        {isMobile && (
          <button
            onClick={closeSidebar}
            aria-label={t("closeMenu")}
            className="absolute top-4 right-4 p-1 rounded-md bg-transparent border-none text-[var(--text-muted)] cursor-pointer flex items-center justify-center transition-colors hover:text-[var(--text-primary)]"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Logo */}
        <div className="flex items-center gap-2.5 px-2 py-3 mb-4">
          <Terminal className="w-6 h-6 text-[var(--accent)]" />
          <h1 className="text-base font-bold font-[var(--font-heading)] text-[var(--text-primary)] -tracking-[0.5px]">
            {BRANDING.appTitle}
          </h1>
        </div>

        {/* Navigation */}
        <nav className="flex-1 pt-4">
          <ul className="space-y-0.5">
            {navSections.map((section) => (
              <li key={section.label ?? "primary"}>
                {section.label && (
                  <div className="px-4 py-2 text-xs uppercase tracking-wider text-[var(--text-muted)]">
                    {section.label}
                  </div>
                )}
                <ul className="space-y-0.5">
                  {section.items.map((item) => {
                    const isActive =
                      pathname === item.href ||
                      (item.href !== "/" && pathname.startsWith(item.href + "/"));
                    const Icon = item.icon;

                    return (
                      <li key={item.href}>
                        <Link
                          href={item.href}
                          className={`flex w-full items-center gap-3 rounded-lg px-4 py-2.5 text-sm font-medium text-[var(--text-secondary)] transition-colors hover:bg-[var(--surface-hover)] hover:text-[var(--text-primary)] ${
                            isActive
                              ? "bg-[var(--accent)] font-[var(--font-heading)] font-semibold text-[var(--text-primary)] hover:bg-[var(--accent)] hover:text-[var(--text-primary)]"
                              : ""
                          }`}
                        >
                          <Icon
                            className="w-5 h-5"
                            style={!isActive ? { color: "var(--text-muted)" } : undefined}
                          />
                          {item.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </li>
            ))}
          </ul>
        </nav>

        {/* Footer */}
        <div className="pt-4 mt-4 border-t border-[var(--border)]">
          <div className="px-4 py-2 text-xs text-[var(--text-muted)]">{BRANDING.appTitle}</div>

          <button
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-2 w-full rounded-lg transition-colors text-[var(--text-muted)] hover:text-[var(--negative)] hover:bg-[var(--card-elevated)] cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span className="text-sm">{t("logout")}</span>
          </button>
        </div>
      </aside>
    </>
  );
}
