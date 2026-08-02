"use client";

import { useState, useMemo } from "react";
import { useEditor, type EditorIntervention } from "@/lib/editor/EditorContext";
import { EntityDialog } from "./EntityDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Search } from "lucide-react";

export function InterventionEditor() {
  const { interventions, domains, addIntervention, updateIntervention, deleteIntervention } = useEditor();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<EditorIntervention | null>(null);
  const [editTarget, setEditTarget] = useState<EditorIntervention | null>(null);
  const [searchQuery, setSearchQuery] = useState("");

  // Form state
  const [formId, setFormId] = useState("");
  const [formNameEn, setFormNameEn] = useState("");

  const interventionList = useMemo(() => {
    const list = Object.values(interventions);
    if (!searchQuery) return list;
    const q = searchQuery.toLowerCase();
    return list.filter(
      (i) => i.id.toLowerCase().includes(q) || i.name.en.toLowerCase().includes(q)
    );
  }, [interventions, searchQuery]);

  // Count references from signals
  const countRefs = (intId: string): number => {
    let count = 0;
    domains.forEach((d) => d.causes.forEach((c) =>
      c.signals.forEach((s) => {
        if (s.interventions?.includes(intId)) count++;
      })
    ));
    return count;
  };

  const openCreate = () => {
    setEditTarget(null);
    setFormId("");
    setFormNameEn("");
    setDialogOpen(true);
  };

  const openEdit = (intervention: EditorIntervention) => {
    setEditTarget(intervention);
    setFormId(intervention.id);
    setFormNameEn(intervention.name.en);
    setDialogOpen(true);
  };

  const handleSave = () => {
    if (!formId.trim() || !formNameEn.trim()) return;
    const intervention: EditorIntervention = {
      id: formId,
      name: { en: formNameEn },
    };
    if (editTarget) {
      updateIntervention(editTarget.id, intervention);
    } else {
      addIntervention(intervention);
    }
    setDialogOpen(false);
  };

  const handleDelete = () => {
    if (deleteTarget) {
      deleteIntervention(deleteTarget.id);
      setDeleteTarget(null);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">Interventions</h3>
          <p className="text-sm text-[var(--text-muted)]">{Object.keys(interventions).length} registered interventions</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-[var(--text-muted)]" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search interventions..."
              className="w-[220px] pl-9 text-sm"
            />
          </div>
          <Button onClick={openCreate} size="sm" className="gap-1.5">
            <Plus className="h-4 w-4" /> Add Intervention
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-[var(--border)]">
        <Table>
          <TableHeader>
            <TableRow className="hover:bg-[var(--surface-hover)]">
              <TableHead className="w-[200px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead className="w-16 text-center">Refs</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {interventionList.map((intervention) => (
              <TableRow key={intervention.id} className="cursor-pointer hover:bg-[var(--surface-hover)]" onClick={() => openEdit(intervention)}>
                <TableCell className="font-mono text-xs text-[var(--text-secondary)]">{intervention.id}</TableCell>
                <TableCell className="text-sm">{intervention.name.en}</TableCell>
                <TableCell className="text-center">
                  <span className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-xs">{countRefs(intervention.id)}</span>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-1" onClick={(e) => e.stopPropagation()}>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-[var(--text-secondary)] hover:text-[var(--text-primary)]" onClick={() => openEdit(intervention)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-red-400/60 hover:text-red-400" onClick={() => setDeleteTarget(intervention)}>
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
        title={editTarget ? "Edit Intervention" : "Add Intervention"}
        description={editTarget ? `Editing "${editTarget.id}"` : "Register a new intervention action."}
        onSave={handleSave}
      >
        <div className="grid gap-3">
          <div>
            <Label className="mb-1 block">Intervention ID</Label>
            <Input value={formId} onChange={(e) => setFormId(e.target.value.toUpperCase())} placeholder="e.g. INT_ACQ_VIS_01_A" className="font-mono" disabled={!!editTarget} />
          </div>
          <div>
            <Label className="mb-1 block">Name</Label>
            <Input value={formNameEn} onChange={(e) => setFormNameEn(e.target.value)} placeholder="e.g. launch targeted display ads" />
          </div>
        </div>
      </EntityDialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(open) => !open && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Intervention</AlertDialogTitle>
            <AlertDialogDescription>
              Delete intervention <strong className="font-mono text-[var(--text-primary)]">{deleteTarget?.id}</strong>?
              {deleteTarget && countRefs(deleteTarget.id) > 0 && (
                <span className="mt-2 block text-yellow-400">
                  ⚠ This intervention is referenced by {countRefs(deleteTarget.id)} signal(s).
                </span>
              )}
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
