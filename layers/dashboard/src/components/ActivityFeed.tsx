"use client";

import { formatDistanceToNow } from "date-fns";
import { es } from "date-fns/locale";
import { Zap, CheckCircle, XCircle, Clock, Activity as ActivityIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import type { LucideIcon } from "lucide-react";
import { getLocale } from "@/i18n/locale";
import { usePolling } from "@/hooks/usePolling";
import { Skeleton } from "@/components/ui/Skeleton";
import { apiFetch } from "@/lib/client-api";

interface Activity {
  id: string;
  action_id: string;
  stage: string;
  status: "executed" | "rejected" | "pending_hitl" | "error";
  session_id: string;
  created_at: string;
}

interface ActivitiesResponse {
  activities: Activity[];
  total: number;
  page: number;
  hasMore: boolean;
}

const statusConfig: Record<string, { icon: LucideIcon; color: string; bgColor: string }> = {
  executed: { icon: CheckCircle, color: "var(--positive)", bgColor: "var(--positive-soft)" },
  rejected: { icon: XCircle, color: "var(--negative)", bgColor: "var(--negative-soft)" },
  pending_hitl: { icon: Clock, color: "var(--warning)", bgColor: "var(--warning-soft)" },
  error: { icon: XCircle, color: "var(--negative)", bgColor: "var(--negative-soft)" },
};

export function ActivityFeed() {
  const t = useTranslations("activity");
  const { data: activities, error } = usePolling(
    async () => {
      const data = await apiFetch<ActivitiesResponse>("/api/activity?limit=50&page=1");
      return data.activities;
    },
    { intervalMs: 5_000 }
  );

  if (error) {
    return (
      <div className="text-center py-12 text-[var(--negative)]">
        <XCircle className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t("failedToLoad")}</p>
      </div>
    );
  }

  if (!activities) {
    return (
      <div>
        {[...Array(5)].map((_, i) => (
          <Skeleton key={i} className="h-16 mx-4 my-2 rounded-lg" />
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="text-center py-12 text-[var(--text-secondary)]">
        <ActivityIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>{t("noActivities")}</p>
      </div>
    );
  }

  return (
    <div>
      {activities.map((activity) => {
        const status = statusConfig[activity.status] || {
          icon: Zap,
          color: "var(--text-secondary)",
          bgColor: "var(--card-elevated)",
        };
        const StatusIcon = status.icon;

        return (
          <div
            key={activity.id}
            className="flex items-center gap-2 md:gap-3 px-3 md:px-4 py-2 md:py-3 rounded-lg transition-colors cursor-pointer hover:bg-[var(--card-elevated)]"
          >
            {/* Status Icon */}
            <div
              className="w-7 h-7 md:w-9 md:h-9 rounded-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: status.bgColor }}
            >
              <StatusIcon
                className="w-3.5 h-3.5 md:w-[18px] md:h-[18px]"
                style={{ color: status.color }}
              />
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 md:gap-2 mb-0.5">
                <span className="text-[10px] md:text-xs font-semibold uppercase text-[var(--text-primary)]">
                  {activity.action_id}
                </span>
                <span
                  className="badge text-[10px] md:text-xs py-0.5 px-1.5 md:px-2 hidden sm:inline-block outline outline-1 text-[var(--text-secondary)]"
                  style={{ outlineColor: "var(--border)" }}
                >
                  {activity.stage}
                </span>
                <span
                  className="badge text-[10px] md:text-xs py-0.5 px-1.5 md:px-2"
                  style={{ backgroundColor: status.bgColor, color: status.color }}
                >
                  {activity.status}
                </span>
              </div>
              <div className="text-xs md:text-sm truncate text-[var(--text-secondary)]">
                {t("session")}: {activity.session_id.substring(0, 8)}...
              </div>
            </div>

            {/* Time */}
            <time className="text-[10px] md:text-xs whitespace-nowrap flex-shrink-0 text-[var(--text-muted)]">
              {formatDistanceToNow(new Date(activity.created_at), {
                addSuffix: false,
                locale: getLocale() === "es" ? es : undefined,
              })}
            </time>
          </div>
        );
      })}
    </div>
  );
}
