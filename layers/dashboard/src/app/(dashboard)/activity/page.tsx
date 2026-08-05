import { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { ActivityFeed } from "@/components/ActivityFeed";

export const metadata: Metadata = {
  title: `Activity Feed | ${process.env.NEXT_PUBLIC_APP_TITLE || "Exnoria"}`,
};

export default async function ActivityPage() {
  const t = await getTranslations("activity");
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-bold tracking-tight font-[var(--font-heading)] text-[var(--text-primary)]">
          {t("title")}
        </h1>
      </div>

      <div className="rounded-xl overflow-hidden border border-[var(--border)] bg-[var(--card)]">
        <ActivityFeed />
      </div>
    </div>
  );
}
