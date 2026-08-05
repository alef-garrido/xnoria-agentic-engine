"use client";

import { History as HistoryIcon } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePolling } from "@/hooks/usePolling";
import { PageHeader } from "@/components/ui/PageHeader";
import { Card } from "@/components/ui/Card";
import { Skeleton } from "@/components/ui/Skeleton";
import { SessionRow, type Session } from "@/components/sessions/SessionRow";

interface SessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  hasMore: boolean;
}

export default function SessionsPage() {
  const t = useTranslations("sessions");
  const { data: sessions, error } = usePolling(
    async () => {
      const res = await fetch("/api/sessions?limit=25&page=1");
      if (!res.ok) throw new Error("Failed to fetch sessions");
      const data: SessionsResponse = await res.json();
      return data.sessions;
    },
    { intervalMs: 10_000 }
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={t("title")} />

      <Card>
        {error && (
          <div className="text-center py-12 text-[var(--negative)]">
            <p>{t("failedToLoad")}</p>
          </div>
        )}

        {!error && !sessions && (
          <div>
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 mx-4 my-2 rounded-lg" />
            ))}
          </div>
        )}

        {sessions && sessions.length === 0 && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>{t("noSessions")}</p>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="flex flex-col">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
