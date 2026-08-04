"use client";

import { useState, useMemo } from "react";
import { useEditor } from "@/features/cx-tools/editor/EditorContext";
import { EntityDialog } from "./EntityDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Signal } from "@/features/cx-tools/shared/types/wheel";

interface FlatSignal {
  domainId: string;
  domainName: string;
  domainColor: string;
  causeId: string;
  causeCode: string;
  causeName: string;
  signal: Signal;
}

const LEVELS = [
  { value: 0, label: "Entry" },
  { value: 1, label: "Commitment" },
  { value: 2, label: "Usage" },
  { value: 3, label: "Engagement" },
];

export function SignalEditor() {
  const { domains, addSignal, updateSignal, deleteSignal } = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FlatSignal | null>(null);
  const [editTarget, setEditTarget] = useState<FlatSignal | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("ALL");

  // Form state
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formSeverity, setFormSeverity] = useState(0.5);
  const [formLevel, setFormLevel] = useState(0);
  const [formDomainId, setFormDomainId] = useState("");
  const [formCauseId, setFormCauseId] = useState("");
  const [formInterventions, setFormInterventions] = useState("");
  const [formIndicators, setFormIndicators] = useState("");

  const flatSignals = useMemo<FlatSignal[]>(() => {
    return domains.flatMap((d) =>
      d.causes.flatMap((c) =>
        c.signals.map((s) => ({
          domainId: d.id,
          domainName: d.name,
          domainColor: d.color,
          causeId: c.id,
          causeCode: c.code,
          causeName: c.name,
          signal: s,
        }))
      )
    );
  }, [domains]);

  const filtered = filterDomain === "ALL" ? flatSignals : flatSignals.filter((fs) => fs.domainId === filterDomain);

  const selectedDomainCauses = useMemo(() => {
    const d = domains.find((dm) => dm.id === formDomainId);
    return d?.causes ?? [];
  }, [domains, formDomainId]);

  const openCreate = () => {
    setEditTarget(null);
    setFormId("");
    setFormName("");
    setFormSeverity(0.5);
    setFormLevel(0);
    setFormDomainId(domains[0]?.id ?? "");
    setFormCauseId("");
    setFormInterventions("");
    setFormIndicators("");
    setDialogOpen(true);
  };

  const openEdit = (fs: FlatSignal) => {
    setEditTarget(fs);
    setFormId(fs.signal.id);
    setFormName(fs.signal.name);
    setFormSeverity(fs.signal.severity ?? 0.5);
    setFormLevel(fs.signal.level ?? 0);
    setFormDomainId(fs.domainId);
    setFormCauseId(fs.causeId);
    setFormInterventions((fs.signal.interventions ?? []).join(", "));
    setFormIndicators((fs.signal.indicators ?? []).map((i) => `${i.id}:${i.name}`).join(", "));
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formId.trim() || !formName.trim() || !formDomainId || !formCauseId) return;

    const indicators = formIndicators
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
      .map((s) => {
        const [id, ...nameParts] = s.split(":");
        return { id: id.trim(), name: (nameParts.join(":") || id).trim() };
      });

    const interventionIds = formInterventions
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const sig: Signal = {
      id: formId,
      name: formName,
      severity: formSeverity,
      level: formLevel,
      indicators,
      interventions: interventionIds,
    };

    if (editTarget) {
      updateSignal(editTarget.domainId, editTarget.causeId, editTarget.signal.id, sig);
    } else {
      addSignal(formDomainId, formCauseId, sig);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteSignal(deleteTarget.domainId, deleteTarget.causeId, deleteTarget.signal.id);
      setDeleteTarget(null);
    }
  };

  const severityColor = (sev: number) => {
    if (sev >= 0.8) return "text-red-400";
    if (sev >= 0.5) return "text-yellow-400";
    return "text-green-400";
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Signals</h3>
          <p className="text-sm text-[var(--text-muted)]">{flatSignals.length} diagnostic signals</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[180px]">
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by domain" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Domains</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-2">
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Signal
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[var(--surface-hover)]">
              <TableHead>ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Cause</TableHead>
              <TableHead className="text-center">Severity</TableHead>
              <TableHead className="text-center">Level</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((fs) => (
              <TableRow key={fs.signal.id} className="cursor-pointer hover:bg-[var(--surface-hover)]" onClick={() => openEdit(fs)}>
                <TableCell className="font-mono text-xs">{fs.signal.id}</TableCell>
                <TableCell className="font-medium">{fs.signal.name}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: fs.domainColor }} />
                    <span className="font-mono text-xs text-[var(--text-secondary)]">{fs.causeCode}</span>
                  </span>
                </TableCell>
                <TableCell className={`text-center font-mono text-sm ${severityColor(fs.signal.severity ?? 0)}`}>
                  {((fs.signal.severity ?? 0) * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-center text-xs text-[var(--text-secondary)]">
                  {LEVELS.find((l) => l.value === fs.signal.level)?.label ?? fs.signal.level}
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => openEdit(fs)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400" onClick={() => setDeleteTarget(fs)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {/* Create / Edit Dialog */}
      <EntityDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        title={editTarget ? "Edit Signal" : "Add Signal"}
        description={editTarget ? `Editing "${editTarget.signal.id}"` : "Add a new diagnostic signal."}
        onSave={handleSave}
      >
        <div className="grid max-h-[400px] gap-3 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">Domain</Label>
              <Select value={formDomainId} onValueChange={(v) => { setFormDomainId(v); setFormCauseId(""); }} disabled={!!editTarget}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">Cause</Label>
              <Select value={formCauseId} onValueChange={setFormCauseId} disabled={!!editTarget}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cause" />
                </SelectTrigger>
                <SelectContent>
                  {selectedDomainCauses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.code} — {c.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block">Signal ID</Label>
            <Input value={formId} onChange={(e) => setFormId(e.target.value.toUpperCase())} placeholder="e.g. ACQ_VIS_01" className="font-mono" disabled={!!editTarget} />
          </div>
          <div>
            <Label className="mb-1 block">Name</Label>
            <Input value={formName} onChange={(e) => setFormName(e.target.value)} placeholder="e.g. low awareness" />
          </div>
          <div>
            <Label className="mb-1 block">Severity: {(formSeverity * 100).toFixed(0)}%</Label>
            <Slider value={[formSeverity]} onValueChange={([v]) => setFormSeverity(v)} min={0} max={1} step={0.05} className="mt-2" />
          </div>
          <div>
            <Label className="mb-1 block">Level (Funnel Stage)</Label>
            <Select value={String(formLevel)} onValueChange={(v) => setFormLevel(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={String(l.value)}>{l.value} — {l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">Indicators <span className="text-[var(--text-muted)]">(comma-separated id:name)</span></Label>
            <Input value={formIndicators} onChange={(e) => setFormIndicators(e.target.value)} placeholder="e.g. ACQ_VIS_01_SV:brand_search_volume" className="font-mono text-xs" />
          </div>
          <div>
            <Label className="mb-1 block">Intervention IDs <span className="text-[var(--text-muted)]">(comma-separated)</span></Label>
            <Input value={formInterventions} onChange={(e) => setFormInterventions(e.target.value)} placeholder="e.g. INT_ACQ_VIS_01_A, INT_ACQ_VIS_01_B" className="font-mono text-xs" />
          </div>
        </div>
      </EntityDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Signal</AlertDialogTitle>
            <AlertDialogDescription>
              Delete signal <strong className="font-mono text-[var(--text-primary)]">{deleteTarget?.signal.id}</strong> — &quot;{deleteTarget?.signal.name}&quot;? This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
