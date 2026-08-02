"use client";

import { EditorProvider, useEditor } from "@/lib/editor/EditorContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { DomainEditor } from "@/components/editor/DomainEditor";
import { CauseEditor } from "@/components/editor/CauseEditor";
import { SignalEditor } from "@/components/editor/SignalEditor";
import { InterventionEditor } from "@/components/editor/InterventionEditor";
import { Download } from "lucide-react";

function EditorContent() {
  const { exportJSON, domains, interventions } = useEditor();

  const totalCauses = domains.reduce((sum, d) => sum + d.causes.length, 0);
  const totalSignals = domains.reduce((sum, d) => sum + d.causes.reduce((s2, c) => s2 + c.signals.length, 0), 0);
  const totalInterventions = Object.keys(interventions).length;

  return (
    <div
      className="flex flex-col overflow-hidden rounded-2xl border border-[var(--border)] bg-[var(--bg)] text-[var(--text-primary)]"
      style={{ height: "calc(100vh - var(--layout-main-inset-y))" }}
    >
      {/* Header */}
      <header className="flex shrink-0 items-center justify-between border-b border-[var(--border)] bg-[var(--card)] p-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight" style={{ fontFamily: "var(--font-heading)" }}>
            CX System Editor
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            {domains.length} domains · {totalCauses} causes · {totalSignals} signals · {totalInterventions} interventions
          </p>
        </div>
        <Button onClick={exportJSON} variant="outline" size="sm" className="gap-1.5">
          <Download className="h-4 w-4" /> Export JSON
        </Button>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-auto p-4 md:p-6">
        <Tabs defaultValue="domains" className="mx-auto w-full max-w-[1400px]">
          <TabsList>
            <TabsTrigger value="domains">Domains</TabsTrigger>
            <TabsTrigger value="causes">Causes</TabsTrigger>
            <TabsTrigger value="signals">Signals</TabsTrigger>
            <TabsTrigger value="interventions">Interventions</TabsTrigger>
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
