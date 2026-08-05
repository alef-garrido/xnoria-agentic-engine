"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useEditor } from "@/features/cx-tools/editor/EditorContext";
import { EntityDialog } from "./EntityDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2 } from "lucide-react";
import type { Domain } from "@/features/cx-tools/shared/types/wheel";

export function DomainEditor() {
  const t = useTranslations("cxtools");
  const { domains, addDomain, updateDomain, deleteDomain } = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Domain | null>(null);
  const [editTarget, setEditTarget] = useState<Domain | null>(null);

  // Form state
  const [formId, setFormId] = useState("");
  const [formName, setFormName] = useState("");
  const [formColor, setFormColor] = useState("#3A86FF");

  const openCreate = () => {
    setEditTarget(null);
    setFormId("");
    setFormName("");
    setFormColor("#3A86FF");
    setDialogOpen(true);
  };

  const openEdit = (d: Domain) => {
    setEditTarget(d);
    setFormId(d.id);
    setFormName(d.name);
    setFormColor(d.color);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formId.trim() || !formName.trim()) return;
    if (editTarget) {
      updateDomain(editTarget.id, { id: formId, name: formName, color: formColor });
    } else {
      addDomain({ id: formId, name: formName, color: formColor, causes: [] });
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteDomain(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">{t("domainsTitle")}</h3>
          <p className="text-sm text-[var(--text-muted)]">{t("lifecycleStages", { count: domains.length })}</p>
        </div>
        <Button onClick={openCreate} size="sm" className="gap-1.5">
          <Plus className="h-4 w-4" /> {t("addDomain")}
        </Button>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[var(--surface-hover)]">
              <TableHead className="w-12">{t("colColor")}</TableHead>
              <TableHead>{t("colId")}</TableHead>
              <TableHead>{t("colName")}</TableHead>
              <TableHead className="text-right">{t("colCauses")}</TableHead>
              <TableHead className="w-24 text-right">{t("colActions")}</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {domains.map((d) => (
              <TableRow key={d.id} className="cursor-pointer hover:bg-[var(--surface-hover)]" onClick={() => openEdit(d)}>
                <TableCell>
                  <div className="h-5 w-5 rounded-full border border-[var(--border-strong)]" style={{ backgroundColor: d.color }} />
                </TableCell>
                <TableCell className="font-mono text-xs text-[var(--text-secondary)]">{d.id}</TableCell>
                <TableCell className="font-medium">{d.name}</TableCell>
                <TableCell className="text-right font-mono text-sm">{d.causes.length}</TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => openEdit(d)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400" onClick={() => setDeleteTarget(d)}>
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
        title={editTarget ? t("editDomain") : t("addDomainTitle")}
        description={editTarget
          ? t("editingEntity", { name: editTarget.name })
          : t("createDomainDesc")}
        onSave={handleSave}
      >
        <div className="grid gap-3">
          <div>
            <Label htmlFor="domain-id" className="mb-1 block">{t("fieldIdentifier")}</Label>
            <Input id="domain-id" value={formId} onChange={(e) => setFormId(e.target.value)} placeholder={t("placeholderAcquisition")} disabled={!!editTarget} />
          </div>
          <div>
            <Label htmlFor="domain-name" className="mb-1 block">{t("fieldName")}</Label>
            <Input id="domain-name" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={t("placeholderAcquisitionName")} />
          </div>
          <div>
            <Label htmlFor="domain-color" className="mb-1 block">{t("fieldColor")}</Label>
            <div className="flex items-center gap-3">
              <input type="color" id="domain-color" value={formColor} onChange={(e) => setFormColor(e.target.value)} className="h-10 w-10 cursor-pointer rounded border border-[var(--border)] bg-transparent" />
              <Input value={formColor} onChange={(e) => setFormColor(e.target.value)} className="flex-1 font-mono text-sm" />
            </div>
          </div>
        </div>
      </EntityDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("deleteDomain")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("deleteDomainDesc", { name: deleteTarget?.name ?? "", count: deleteTarget?.causes.length ?? 0 })}
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
