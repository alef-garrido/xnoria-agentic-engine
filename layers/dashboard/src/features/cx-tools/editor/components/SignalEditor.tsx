"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useEditor } from "@/features/cx-tools/editor/EditorContext";
import { EntityDialog } from "./EntityDialog";
import { Button } from "@/features/cx-tools/editor/components/ui/button";
import { Input } from "@/features/cx-tools/editor/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
  { value: 0, label: "levelEntry" },
  { value: 1, label: "levelCommitment" },
  { value: 2, label: "levelUsage" },
  { value: 3, label: "levelEngagement" },
];

export function SignalEditor() {
  const t = useTranslations("cxtools");
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

  const filtered =
    filterDomain === "ALL" ? flatSignals : flatSignals.filter((fs) => fs.domainId === filterDomain);

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
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t("signalsTitle")}</h3>
          <p className="text-sm text-[var(--text-muted)]">
            {t("diagnosticSignals", { count: flatSignals.length })}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-[180px]">
            <Select value={filterDomain} onValueChange={setFilterDomain}>
              <SelectTrigger>
                <SelectValue placeholder={t("filterByDomain")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">{t("allDomains")}</SelectItem>
                {domains.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    <span className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded-full"
                        style={{ backgroundColor: d.color }}
                      />
                      {d.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> {t("addSignal")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[var(--surface-hover)]">
              <TableHead>{t("colId")}</TableHead>
              <TableHead>{t("colName")}</TableHead>
              <TableHead>{t("colCause")}</TableHead>
              <TableHead className="text-center">{t("colSeverity")}</TableHead>
              <TableHead className="text-center">{t("colLevel")}</TableHead>
              <TableHead className="w-24 text-right">{t("colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((fs) => (
              <TableRow
                key={fs.signal.id}
                className="cursor-pointer hover:bg-[var(--surface-hover)]"
                onClick={() => openEdit(fs)}
              >
                <TableCell className="font-mono text-xs">{fs.signal.id}</TableCell>
                <TableCell className="font-medium">{fs.signal.name}</TableCell>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full"
                      style={{ backgroundColor: fs.domainColor }}
                    />
                    <span className="font-mono text-xs text-[var(--text-secondary)]">
                      {fs.causeCode}
                    </span>
                  </span>
                </TableCell>
                <TableCell
                  className={`text-center font-mono text-sm ${severityColor(fs.signal.severity ?? 0)}`}
                >
                  {((fs.signal.severity ?? 0) * 100).toFixed(0)}%
                </TableCell>
                <TableCell className="text-center text-xs text-[var(--text-secondary)]">
                  {LEVELS.find((l) => l.value === fs.signal.level)
                    ? t(LEVELS.find((l) => l.value === fs.signal.level)!.label)
                    : fs.signal.level}
                </TableCell>
                <TableCell className="text-right">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                      onClick={() => openEdit(fs)}
                    >
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-red-400/60 hover:text-red-400"
                      onClick={() => setDeleteTarget(fs)}
                    >
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
        title={editTarget ? t("editSignal") : t("addSignalTitle")}
        description={
          editTarget ? t("editingEntity", { name: editTarget.signal.id }) : t("createSignalDesc")
        }
        onSave={handleSave}
      >
        <div className="grid max-h-[400px] gap-3 overflow-y-auto pr-2">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="mb-1 block">{t("colDomain")}</Label>
              <Select
                value={formDomainId}
                onValueChange={(v) => {
                  setFormDomainId(v);
                  setFormCauseId("");
                }}
                disabled={!!editTarget}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {domains.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="mb-1 block">{t("fieldCause")}</Label>
              <Select value={formCauseId} onValueChange={setFormCauseId} disabled={!!editTarget}>
                <SelectTrigger>
                  <SelectValue placeholder={t("selectCause")} />
                </SelectTrigger>
                <SelectContent>
                  {selectedDomainCauses.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.code} — {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label className="mb-1 block">{t("fieldSignalId")}</Label>
            <Input
              value={formId}
              onChange={(e) => setFormId(e.target.value.toUpperCase())}
              placeholder={t("placeholderSignalId")}
              className="font-mono"
              disabled={!!editTarget}
            />
          </div>
          <div>
            <Label className="mb-1 block">{t("fieldName")}</Label>
            <Input
              value={formName}
              onChange={(e) => setFormName(e.target.value)}
              placeholder={t("placeholderSignalName")}
            />
          </div>
          <div>
            <Label className="mb-1 block">
              {t("severityValue", { value: (formSeverity * 100).toFixed(0) })}
            </Label>
            <Slider
              value={[formSeverity]}
              onValueChange={([v]) => setFormSeverity(v)}
              min={0}
              max={1}
              step={0.05}
              className="mt-2"
            />
          </div>
          <div>
            <Label className="mb-1 block">{t("fieldLevel")}</Label>
            <Select value={String(formLevel)} onValueChange={(v) => setFormLevel(Number(v))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {LEVELS.map((l) => (
                  <SelectItem key={l.value} value={String(l.value)}>
                    {l.value} — {t(l.label)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="mb-1 block">
              {t("fieldIndicators")}{" "}
              <span className="text-[var(--text-muted)]">{t("fieldIndicatorHint")}</span>
            </Label>
            <Input
              value={formIndicators}
              onChange={(e) => setFormIndicators(e.target.value)}
              placeholder={t("placeholderIndicator")}
              className="font-mono text-xs"
            />
          </div>
          <div>
            <Label className="mb-1 block">
              {t("fieldInterventionIds")}{" "}
              <span className="text-[var(--text-muted)]">{t("fieldInterventionHint")}</span>
            </Label>
            <Input
              value={formInterventions}
              onChange={(e) => setFormInterventions(e.target.value)}
              placeholder={t("placeholderInterventionIds")}
              className="font-mono text-xs"
            />
          </div>
        </div>
      </EntityDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteSignal")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteSignalDesc", {
                id: deleteTarget?.signal.id ?? "",
                name: deleteTarget?.signal.name ?? "",
              })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete}>{t("delete")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
