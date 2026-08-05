"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { useEditor } from "@/features/cx-tools/editor/EditorContext";
import { EntityDialog } from "./EntityDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Cause } from "@/features/cx-tools/shared/types/wheel";

interface FlatCause {
  domainId: string;
  domainName: string;
  domainColor: string;
  cause: Cause;
}

export function CauseEditor() {
  const t = useTranslations("cxtools");
  const { domains, addCause, updateCause, deleteCause } = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<FlatCause | null>(null);
  const [editTarget, setEditTarget] = useState<FlatCause | null>(null);
  const [filterDomain, setFilterDomain] = useState<string>("ALL");

  // Form state
  const [formId, setFormId] = useState("");
  const [formCode, setFormCode] = useState("");
  const [formName, setFormName] = useState("");
  const [formDomainId, setFormDomainId] = useState("");

  const flatCauses = useMemo<FlatCause[]>(() => {
    return domains.flatMap((d) =>
      d.causes.map((c) => ({
        domainId: d.id,
        domainName: d.name,
        domainColor: d.color,
        cause: c,
      }))
    );
  }, [domains]);

  const filtered = filterDomain === "ALL" ? flatCauses : flatCauses.filter((fc) => fc.domainId === filterDomain);

  const openCreate = () => {
    setEditTarget(null);
    setFormId("");
    setFormCode("");
    setFormName("");
    setFormDomainId(domains[0]?.id ?? "");
    setDialogOpen(true);
  };

  const openEdit = (fc: FlatCause) => {
    setEditTarget(fc);
    setFormId(fc.cause.id);
    setFormCode(fc.cause.code);
    setFormName(fc.cause.name);
    setFormDomainId(fc.domainId);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formId.trim() || !formCode.trim() || !formName.trim() || !formDomainId) return;
    if (editTarget) {
      updateCause(editTarget.domainId, editTarget.cause.id, {
        id: formId,
        code: formCode,
        name: formName,
      });
    } else {
      addCause(formDomainId, {
        id: formId,
        code: formCode,
        name: formName,
        signals: [],
        indicators: [],
        interventions: [],
      });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteCause(deleteTarget.domainId, deleteTarget.cause.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t("causesTitle")}</h3>
          <p className="text-sm text-[var(--text-muted)]">{t("rootCausesAcross", { count: flatCauses.length, domains: domains.length })}</p>
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
                      <span className="inline-block h-2 w-2 rounded-full" style={{ backgroundColor: d.color }} />
                      {d.name}
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> {t("addCause")}
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[var(--surface-hover)]">
              <TableHead>{t("colDomain")}</TableHead>
              <TableHead>{t("colCode")}</TableHead>
              <TableHead>{t("colName")}</TableHead>
              <TableHead className="text-right">{t("colSignals")}</TableHead>
              <TableHead className="text-right">{t("colInterventions")}</TableHead>
              <TableHead className="w-24 text-right">{t("colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((fc) => (
              <TableRow key={`${fc.domainId}-${fc.cause.id}`} className="cursor-pointer hover:bg-[var(--surface-hover)]" onClick={() => openEdit(fc)}>
                <TableCell>
                  <span className="flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: fc.domainColor }} />
                    <span className="text-xs text-[var(--text-secondary)]">{fc.domainName}</span>
                  </span>
                </TableCell>
                <TableCell className="font-mono text-xs font-bold">{fc.cause.code}</TableCell>
                <TableCell className="font-medium">{fc.cause.name}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fc.cause.signals.length}</TableCell>
                <TableCell className="text-right font-mono text-sm">{fc.cause.interventions.length}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => openEdit(fc)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400" onClick={() => setDeleteTarget(fc)}>
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
        title={editTarget ? t("editCause") : t("addCauseTitle")}
        description={editTarget ? t("editingIn", { name: editTarget.cause.name, domain: editTarget.domainName }) : t("createCauseDesc")}
        onSave={handleSave}
      >
        <div className="grid gap-3">
          <div>
            <Label htmlFor="cause-domain" className="mb-1 block">{t("fieldParentDomain")}</Label>
            <Select value={formDomainId} onValueChange={setFormDomainId} disabled={!!editTarget}>
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
            <Label htmlFor="cause-id" className="mb-1 block">{t("fieldIdentifier")}</Label>
            <Input id="cause-id" value={formId} onChange={(e) => setFormId(e.target.value)} placeholder={t("placeholderVis")} disabled={!!editTarget} />
          </div>
          <div>
            <Label htmlFor="cause-code" className="mb-1 block">{t("fieldCode")}</Label>
            <Input id="cause-code" value={formCode} onChange={(e) => setFormCode(e.target.value.toUpperCase())} placeholder={t("placeholderAcqVis")} className="font-mono" />
          </div>
          <div>
            <Label htmlFor="cause-name" className="mb-1 block">{t("fieldName")}</Label>
            <Input id="cause-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t("placeholderVisibility")} />
          </div>
        </div>
      </EntityDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteCause")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteCauseDesc", {
                code: deleteTarget?.cause.code ?? "",
                name: deleteTarget?.cause.name ?? "",
                count: deleteTarget?.cause.signals.length ?? 0,
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
