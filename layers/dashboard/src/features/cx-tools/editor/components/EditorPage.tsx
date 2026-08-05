"use client";

import { useRef, useState, type ChangeEvent } from "react";
import { useTranslations } from "next-intl";
import { EditorProvider, useEditor } from "@/features/cx-tools/editor/EditorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/features/cx-tools/editor/components/ui/button";
import { DomainEditor } from "@/features/cx-tools/editor/components/DomainEditor";
import { CauseEditor } from "@/features/cx-tools/editor/components/CauseEditor";
import { SignalEditor } from "@/features/cx-tools/editor/components/SignalEditor";
import { InterventionEditor } from "@/features/cx-tools/editor/components/InterventionEditor";
import { Download, Upload, RotateCcw } from "lucide-react";

function EditorContent() {
  const t = useTranslations("cxtools");
  const { exportJSON, importJSON, resetToCanonical, domains, interventions } = useEditor();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importError, setImportError] = useState<string | null>(null);

  const totalCauses = domains.reduce((sum, d) => sum + d.causes.length, 0);
  const totalSignals = domains.reduce(
    (sum, d) => sum + d.causes.reduce((s2, c) => s2 + c.signals.length, 0),
    0
  );
  const totalInterventions = Object.keys(interventions).length;

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      try {
        importJSON(String(reader.result));
        setImportError(null);
      } catch {
        setImportError(t("importError"));
      }
    };
    reader.onerror = () => setImportError(t("importError"));
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleReset = () => {
    if (window.confirm(t("resetConfirm"))) resetToCanonical();
  };

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
        <div className="flex items-center gap-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="application/json,.json"
            className="hidden"
            onChange={handleFileChange}
          />
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            size="sm"
            className="gap-1.5"
          >
            <Upload className="h-4 w-4" /> {t("importJson")}
          </Button>
          <Button onClick={exportJSON} variant="outline" size="sm" className="gap-1.5">
            <Download className="h-4 w-4" /> {t("exportJson")}
          </Button>
          <Button onClick={handleReset} variant="destructive" size="sm" className="gap-1.5">
            <RotateCcw className="h-4 w-4" /> {t("resetCanonical")}
          </Button>
        </div>
      </header>

      {/* Import Error Banner */}
      {importError && (
        <div className="shrink-0 border-b border-[var(--border)] bg-red-950/40 px-4 py-2 text-xs text-red-300">
          {importError}
        </div>
      )}

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
