import Link from "next/link";
import { Compass, Radar, LayoutGrid, Pencil, ChevronRight } from "lucide-react";

const TOOLS = [
  {
    href: "/tools/compass",
    label: "Compass",
    description: "Churn wheel explorer — domain, cause and signal navigation.",
    icon: Compass,
  },
  {
    href: "/tools/radar",
    label: "Radar",
    description: "Signal radar — live signals, detection and action plan export.",
    icon: Radar,
  },
  {
    href: "/tools/matriz",
    label: "Matriz",
    description: "Impact/effort matrix — prioritization of interventions.",
    icon: LayoutGrid,
  },
  {
    href: "/tools/editor",
    label: "Editor",
    description: "Wheel editor — configure domains, causes, signals and interventions.",
    icon: Pencil,
  },
];

export default function ToolsLanding() {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1
          className="text-2xl font-bold tracking-tight"
          style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
        >
          CX Tools
        </h1>
        <p className="mt-1 text-sm" style={{ color: "var(--text-secondary)" }}>
          Decision-support tools for customer experience analysis.
        </p>
      </div>

      <div
        className="grid gap-4"
        style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}
      >
        {TOOLS.map((tool) => {
          const Icon = tool.icon;
          return (
            <Link
              key={tool.href}
              href={tool.href}
              className="group flex flex-col gap-3 rounded-xl border p-5 transition-colors"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
              }}
            >
              <div className="flex items-center justify-between">
                <Icon
                  className="w-6 h-6"
                  style={{ color: "var(--accent)" }}
                />
                <ChevronRight
                  className="w-5 h-5 transition-transform group-hover:translate-x-1"
                  style={{ color: "var(--text-muted)" }}
                />
              </div>
              <div>
                <div
                  className="font-semibold"
                  style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
                >
                  {tool.label}
                </div>
                <p className="mt-1 text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
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
