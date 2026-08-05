/**
 * generateActionPlanPdf.ts
 *
 * Ported from the CX Churn Wheel repo (src/lib/generateActionPlanPdf.ts).
 * Adapted for the dashboard:
 * - Interventions read directly from FlatSignal.interventions (pre-resolved
 *   { id, name } objects by signalBuilder) instead of a getIntervention lookup
 */

import jsPDF from "jspdf";
import type { FlatSignal } from "@/features/cx-tools/shared/types/signal";

/* ─── Localized strings ──────────────────────────────────────────── */

const PDF_STRINGS: Record<string, { title: string; generated: string; indicators: string; interventions: string; bullet: string }> = {
  en: {
    title: "CX Action Plan",
    generated: "Generated {date}  •  {count} signals  •  {domains} domains",
    indicators: "INDICATORS",
    interventions: "INTERVENTIONS",
    bullet: "›  ",
  },
  es: {
    title: "Plan de Acción CX",
    generated: "Generado {date}  •  {count} señales  •  {domains} dominios",
    indicators: "INDICADORES",
    interventions: "INTERVENCIONES",
    bullet: "›  ",
  },
};

function pdfStrings(language?: string) {
  return PDF_STRINGS[language === "es" ? "es" : "en"];
}

/* ─── Colour helpers ──────────────────────────────────────────────── */

function hexToRgb(hex: string): [number, number, number] {
  const h = hex.replace("#", "");
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function darken(rgb: [number, number, number], pct = 0.3): [number, number, number] {
  return rgb.map((c) => Math.round(c * (1 - pct))) as [number, number, number];
}

/* ─── Design tokens ───────────────────────────────────────────────── */

const PAGE_BG: [number, number, number] = [15, 15, 20];
const CARD_BG: [number, number, number] = [24, 24, 34];
const WHITE: [number, number, number] = [255, 255, 255];
const BODY: [number, number, number] = [200, 200, 210];
const MUTED: [number, number, number] = [130, 130, 150];
const ACCENT: [number, number, number] = [99, 102, 241];

/* ─── Public API ──────────────────────────────────────────────────── */

export interface ActionPlanPdfOptions {
  signals: FlatSignal[];
  selectedIds: string[];
  language?: string;
}

export function generateActionPlanPdf({
  signals,
  selectedIds,
  language,
}: ActionPlanPdfOptions): void {
  const selected = signals.filter((s) => selectedIds.includes(s.id));
  if (selected.length === 0) return;
  const strs = pdfStrings(language);

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mx = 16;                    // horizontal margin
  const cw = pw - mx * 2;          // content width
  const bottomSafe = ph - 18;      // footer safe zone
  let y = 0;

  const today = new Date().toISOString().split("T")[0];

  /* ── Helpers ──────────────────────────────────────────────────── */

  const fillPage = () => {
    doc.setFillColor(...PAGE_BG);
    doc.rect(0, 0, pw, ph, "F");
  };

  const newPage = () => { doc.addPage(); fillPage(); y = 16; };

  const ensure = (h: number) => { if (y + h > bottomSafe) newPage(); };

  const wrap = (text: string, maxW: number) =>
    doc.splitTextToSize(text, maxW) as string[];

  /* ── First page background ────────────────────────────────────── */
  fillPage();
  y = 26;

  /* ── Header ───────────────────────────────────────────────────── */

  // accent bar
  doc.setFillColor(...ACCENT);
  doc.rect(mx, y, 36, 1.2, "F");
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(24);
  doc.setTextColor(...WHITE);
  doc.text(strs.title, mx, y);
  y += 9;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...MUTED);
  const uniqueDomains = new Set(selected.map((s) => s.domainName)).size;
  doc.text(
    strs.generated
      .replace("{date}", today)
      .replace("{count}", String(selected.length))
      .replace("{domains}", String(uniqueDomains)),
    mx,
    y
  );
  y += 14;

  /* ── Group signals by domain ──────────────────────────────────── */

  const grouped = new Map<string, FlatSignal[]>();
  for (const s of selected) {
    if (!grouped.has(s.domainName)) grouped.set(s.domainName, []);
    grouped.get(s.domainName)!.push(s);
  }

  for (const [domainName, domainSignals] of grouped) {
    const domainRgb = hexToRgb(domainSignals[0].domainColor);

    /* ─ Domain header bar ─ */
    ensure(14);
    doc.setFillColor(...domainRgb);
    doc.roundedRect(mx, y, cw, 9, 1.5, 1.5, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...WHITE);
    doc.text(domainName.toUpperCase(), mx + 4, y + 6.3);

    // count badge
    const badge = `${domainSignals.length}`;
    const bw = doc.getTextWidth(badge) + 6;
    doc.setFillColor(...darken(domainRgb, 0.45));
    doc.roundedRect(pw - mx - bw - 3, y + 1.8, bw, 5.4, 1, 1, "F");
    doc.setFontSize(8);
    doc.text(badge, pw - mx - bw / 2 - 3, y + 5.6, { align: "center" });
    y += 14;

    /* ─ Signal cards ─ */
    for (const sig of domainSignals) {
      // Pre-calculate card height so we can draw background first
      const resolvedInterventions = sig.interventions ?? [];
      let cardH = 18; // base (label + severity row)

      if (sig.indicators && sig.indicators.length > 0) {
        cardH += 5 + sig.indicators.length * 5;
      }

      if (resolvedInterventions.length > 0) {
        cardH += 6; // section header
        for (const ri of resolvedInterventions) {
          // Temporarily set font to measure
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          const lines = wrap(ri.name, cw - 24);
          cardH += lines.length * 4.2 + 2;
        }
      }

      cardH += 4; // bottom padding
      ensure(cardH);

      // Draw card background
      const cardTop = y;
      doc.setFillColor(...CARD_BG);
      doc.roundedRect(mx + 1, y, cw - 2, cardH, 2, 2, "F");

      // Left accent stripe
      doc.setFillColor(...domainRgb);
      doc.rect(mx + 1, y + 2, 1.2, cardH - 4, "F");

      y += 6;

      // Signal label
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...WHITE);
      const label = sig.label.charAt(0).toUpperCase() + sig.label.slice(1);
      doc.text(label, mx + 7, y);

      // Signal code
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(sig.id, pw - mx - 5, y, { align: "right" });
      y += 4;

      // Severity bar
      const severity = sig.severity ?? 0.5;
      const barW = 44;
      doc.setFillColor(40, 40, 52);
      doc.roundedRect(mx + 7, y, barW, 2.2, 0.8, 0.8, "F");
      doc.setFillColor(...domainRgb);
      doc.roundedRect(mx + 7, y, Math.max(barW * severity, 2), 2.2, 0.8, 0.8, "F");
      doc.setFontSize(7);
      doc.setTextColor(...MUTED);
      doc.text(`${Math.round(severity * 100)}%`, mx + barW + 10, y + 2);
      y += 6;

      // Indicators
      if (sig.indicators && sig.indicators.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...ACCENT);
        doc.text(strs.indicators, mx + 7, y);
        y += 4;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...BODY);
        for (const ind of sig.indicators) {
          doc.text(`${strs.bullet}${ind.name.replace(/_/g, " ")}`, mx + 10, y);
          y += 5;
        }
        y += 1;
      }

      // Interventions
      if (resolvedInterventions.length > 0) {
        doc.setFont("helvetica", "bold");
        doc.setFontSize(7.5);
        doc.setTextColor(...ACCENT);
        doc.text(strs.interventions, mx + 7, y);
        y += 4.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...BODY);

        for (const ri of resolvedInterventions) {
          // Checkbox
          doc.setDrawColor(...MUTED);
          doc.setLineWidth(0.25);
          doc.rect(mx + 10, y - 2.6, 2.8, 2.8);

          const lines = wrap(ri.name, cw - 24);
          for (let i = 0; i < lines.length; i++) {
            doc.text(lines[i], mx + 16, y);
            y += 4.2;
          }
          y += 0.8;
        }
      }

      // Ensure y matches calculated cardH
      y = cardTop + cardH + 4;
    }

    y += 3;
  }

  /* ── Footers ──────────────────────────────────────────────────── */
  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(strs.title, mx, ph - 8);
    doc.text(`${i} / ${pages}`, pw - mx, ph - 8, { align: "right" });
  }

  /* ── Download ─────────────────────────────────────────────────── */
  const suffix = language === "es" ? "-es" : "";
  doc.save(`cx-action-plan${suffix}-${today}.pdf`);
}
