"use client";

import { useTranslations } from "next-intl";
import { EditorProvider, useEditor } from "@/features/cx-tools/editor/EditorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/features/cx-tools/editor/components/ui/button";
import { DomainEditor } from "@/features/cx-tools/editor/components/DomainEditor";
import { CauseEditor } from "@/features/cx-tools/editor/components/CauseEditor";
import { SignalEditor } from "@/features/cx-tools/editor/components/SignalEditor";
import { InterventionEditor } from "@/features/cx-tools/editor/components/InterventionEditor";
import { Download } from "lucide-react";

function EditorContent() {
  const t = useTranslations("cxtools");
  const { exportJSON, domains, interventions } = useEditor();

  const totalCauses = domains.reduce((sum, d) => sum + d.causes.length, 0);
  const totalSignals = domains.reduce(
    (sum, d) => sum + d.causes.reduce((s2, c) => s2 + c.signals.length, 0),
    0
  );
  const totalInterventions = Object.keys(interventions).length;

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)] h-[calc(100vh_-_var(--layout-main-inset-y))]">
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] p-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight font-[var(--font-heading)]">
            {t("editorTitle")}
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            {t("editorCounts", {
              domains: domains.length,
              causes: totalCauses,
              signals: totalSignals,
              interventions: totalInterventions,
            })}
          </p>
        </div>
        <Button onClick={exportJSON} variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" /> {t("exportJson")}
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Tabs defaultValue="domains" className="mx-auto w-full max-w-[1400px]">
          <TabsList>
            <TabsTrigger value="domains">{t("tabDomains")}</TabsTrigger>
            <TabsTrigger value="causes">{t("tabCauses")}</TabsTrigger>
            <TabsTrigger value="signals">{t("tabSignals")}</TabsTrigger>
            <TabsTrigger value="interventions">{t("tabInterventions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="domains">
            <DomainEditor />
          </TabsContent>
          <TabsContent value="causes">
            <CauseEditor />
          </TabsContent>
          <TabsContent value="signals">
            <SignalEditor />
          </TabsContent>
          <TabsContent value="interventions">
            <InterventionEditor />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

export default function EditorPage() {
  return (
    <EditorProvider>
      <EditorContent />
    </EditorProvider>
  );
}
