import Link from "next/link";
import { Compass, Radar, LayoutGrid, Pencil, ChevronRight } from "lucide-react";
import { getTranslations } from "next-intl/server";

export default async function ToolsLanding() {
  const t = await getTranslations("tools");
  const tc = await getTranslations("cxtools");

  const TOOLS = [
    {
      href: "/tools/compass",
      label: tc("toolCompass"),
      description: t("compassDesc"),
      icon: Compass,
    },
    {
      href: "/tools/radar",
      label: tc("toolRadar"),
      description: t("radarDesc"),
      icon: Radar,
    },
    {
      href: "/tools/matriz",
      label: tc("toolMatriz"),
      description: t("matrizDesc"),
      icon: LayoutGrid,
    },
    {
      href: "/tools/editor",
      label: tc("toolEditor"),
      description: t("editorDesc"),
      icon: Pencil,
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="mt-1 text-sm text-[var(--text-secondary)]">{t("subtitle")}</p>
      </div>

      <div className="grid gap-4 grid-cols-[repeat(auto-fill,minmax(240px,1fr))]">
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col gap-3 rounded-xl border p-5 transition-colors bg-[var(--card)] border-[var(--border)]"
            >
              <div className="flex items-center justify-between">
                <Icon className="w-6 h-6 text-[var(--accent)]" />
                <ChevronRight className="w-5 h-5 transition-transform group-hover:translate-x-1 text-[var(--text-muted)]" />
              </div>
              <div>
                <div className="font-semibold font-[var(--font-heading)] text-[var(--text-primary)]">
                  {tool.label}
                </div>
                <p className="mt-1 text-sm leading-relaxed text-[var(--text-secondary)]">
                  {tool.description}
                </p>
              </div>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
