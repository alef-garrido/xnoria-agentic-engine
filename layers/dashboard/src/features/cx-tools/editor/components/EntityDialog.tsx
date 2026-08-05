"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/features/cx-tools/editor/components/ui/button";
import { useTranslations } from "next-intl";
import type { ReactNode } from "react";

interface EntityDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  children: ReactNode;
  onSave: () => void;
  saveLabel?: string;
}

export function EntityDialog({ open, onOpenChange, title, description, children, onSave, saveLabel }: EntityDialogProps) {
  const t = useTranslations("cxtools");
  const resolvedSaveLabel = saveLabel ?? t("save");
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          {description && <DialogDescription>{description}</DialogDescription>}
        </DialogHeader>
        <div className="grid gap-4 py-2">
          {children}
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>{t("cancel")}</Button>
          <Button onClick={onSave}>{resolvedSaveLabel}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
