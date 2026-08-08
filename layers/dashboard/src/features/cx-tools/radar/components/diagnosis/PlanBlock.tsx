"use client";

import { ListOrdered, Play, Hourglass, ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import type { PlanDto } from "@/lib/diagnosis";

const PRIORITY_COLORS: Record<string, string> = {
  P0: "var(--negative)",
  P1: "var(--warning)",
  P2: "var(--text-muted)",
};

interface PlanBlockProps {
  plan: PlanDto;
  stageNames: Record<string, string>;
  executingKey: string | null;
  onExecute: (planId: string, index: number) => void;
}

export default function PlanBlock({ plan, stageNames, executingKey, onExecute }: PlanBlockProps) {
  const t = useTranslations("diagnosis");
  const items = plan.items ?? [];

  return (
    <div className="rounded-xl bg-[var(--card-elevated)] border border-[var(--border)]">
      <div className="p-4 pb-3">
        <div className="flex items-center gap-2 mb-1">
          <ListOrdered className="w-3.5 h-3.5 text-[var(--accent)]" />
          <span className="text-[10px] uppercase tracking-widest font-bold text-[var(--accent)]">
            {t("planTitle")}
          </span>
          <span className="ml-auto text-[10px] font-mono text-[var(--text-muted)]">
            {plan.items.length} {t("planCount")}
          </span>
        </div>
        <p className="text-[11px] text-[var(--text-muted)]">{t("planSubtitle")}</p>
      </div>

      {items.length === 0 ? (
        <p className="px-4 pb-4 text-xs text-[var(--text-muted)]">{t("planEmpty")}</p>
      ) : (
        <div className="flex flex-col gap-2 px-4 pb-4">
          {items.map((item, index) => {
            const priorityColor = PRIORITY_COLORS[item.priority] ?? "var(--text-muted)";
            const executing = executingKey === `${plan.id}:${index}`;
            return (
              <div
                key={item.rank}
                className="rounded-xl p-3 bg-[var(--card)] border border-[var(--border)]"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className="text-[10px] font-bold px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: priorityColor, color: "#fff" }}
                    >
                      {item.priority}
                    </span>
                    <span className="font-mono text-xs font-semibold truncate text-[var(--text-primary)]">
                      {item.action_id}
                    </span>
                    {item.requires_hitl && (
                      <Badge className="text-[10px] px-1.5 py-0.5 bg-[var(--accent-soft)] text-[var(--accent)] border-[var(--accent)]">
                        {t("requiresHitl")}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant={item.requires_hitl ? "outline" : "primary"}
                    disabled={executingKey !== null}
                    onClick={() => onExecute(plan.id, index)}
                    className="text-[11px] px-3 py-1.5 shrink-0"
                  >
                    {executing ? (
                      <Hourglass className="w-3 h-3 animate-pulse" />
                    ) : item.requires_hitl ? (
                      <ShieldCheck className="w-3 h-3" />
                    ) : (
                      <Play className="w-3 h-3" />
                    )}
                    {executing ? t("executing") : t("execute")}
                  </Button>
                </div>
                <p className="mt-1.5 text-[11px] text-[var(--text-secondary)]">
                  {t("stage")} {item.stage} · {stageNames[item.stage] ?? item.stage}
                </p>
                <p className="mt-1 text-xs leading-relaxed text-[var(--text-muted)]">
                  {item.rationale}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
