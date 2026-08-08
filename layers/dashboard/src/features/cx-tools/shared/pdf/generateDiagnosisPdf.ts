/**
 * generateDiagnosisPdf.ts
 *
 * Dark-styled PDF export for an on-demand diagnosis + its action plan.
 * Follows the visual language of generateActionPlanPdf (page bg, cards,
 * accent bars, footers) but renders cognitive-layer output:
 * verdict summary, stage health, findings (severity/confidence/evidence)
 * and the prioritized plan actions.
 */

import jsPDF from "jspdf";
import type { DiagnosisDto, PlanDto } from "@/lib/diagnosis";
import type { FlatSignal } from "@/features/cx-tools/shared/types/signal";

interface DiagnosisPdfOptions {
  diagnosis: DiagnosisDto;
  plan: PlanDto | null;
  stageNames: Record<string, string>;
  signals: FlatSignal[];
  language?: string;
}

const PDF_STRINGS: Record<
  string,
  {
    title: string;
    meta: string;
    verdict: string;
    stageHealth: string;
    findings: string;
    noFindings: string;
    evidence: string;
    confidence: string;
    weakest: string;
    lowData: string;
    planTitle: string;
    planEmpty: string;
    rationale: string;
    expected: string;
    rank: string;
    hitl: string;
    bullet: string;
  }
> = {
  en: {
    title: "Agent Diagnosis Report",
    meta: "Contact {contact}  •  {date}  •  {model}",
    verdict: "DIAGNOSTIC VERDICT",
    stageHealth: "JOURNEY STAGE HEALTH",
    findings: "FINDINGS",
    noFindings: "No findings were detected for this contact.",
    evidence: "EVIDENCE",
    confidence: "confidence",
    weakest: "weakest",
    lowData: "Limited signal data — result may be less confident",
    planTitle: "PRIORITIZED ACTION PLAN",
    planEmpty: "No actions were generated for this diagnosis.",
    rationale: "RATIONALE",
    expected: "EXPECTED OUTCOME",
    rank: "RANK",
    hitl: "HITL",
    bullet: "›  ",
  },
  es: {
    title: "Informe de Diagnóstico del Agente",
    meta: "Contacto {contact}  •  {date}  •  {model}",
    verdict: "VEREDICTO DEL DIAGNÓSTICO",
    stageHealth: "SALUD POR ETAPA DEL VIAJE",
    findings: "HALLAZGOS",
    noFindings: "No se detectaron hallazgos para este contacto.",
    evidence: "EVIDENCIA",
    confidence: "confianza",
    weakest: "más débil",
    lowData: "Datos de señal limitados — los resultados pueden ser menos fiables",
    planTitle: "PLAN DE ACCIÓN PRIORIZADO",
    planEmpty: "No se generaron acciones para este diagnóstico.",
    rationale: "JUSTIFICACIÓN",
    expected: "RESULTADO ESPERADO",
    rank: "RANGO",
    hitl: "HITL",
    bullet: "›  ",
  },
};

function strings(language?: string) {
  return language === "es" ? PDF_STRINGS.es : PDF_STRINGS.en;
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

function darken(rgb: [number, number, number], pct = 0.35): [number, number, number] {
  return rgb.map((c) => Math.round(c * (1 - pct))) as [number, number, number];
}

function stageBarColor(score: number): [number, number, number] {
  if (score >= 0.7) return [52, 211, 153]; // emerald
  if (score >= 0.4) return [245, 158, 11]; // amber
  return [239, 68, 68]; // red
}

function priorityColor(p: string): [number, number, number] {
  if (p === "P0") return [239, 68, 68];
  if (p === "P1") return [245, 158, 11];
  return [130, 130, 150];
}

/* ─── Design tokens ───────────────────────────────────────────────── */

const PAGE_BG: [number, number, number] = [15, 15, 20];
const CARD_BG: [number, number, number] = [24, 24, 34];
const WHITE: [number, number, number] = [255, 255, 255];
const BODY: [number, number, number] = [200, 200, 210];
const MUTED: [number, number, number] = [130, 130, 150];
const ACCENT: [number, number, number] = [99, 102, 241];

export function generateDiagnosisPdf(options: DiagnosisPdfOptions): void {
  const { diagnosis, plan, stageNames, signals, language } = options;
  const strs = strings(language);
  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const pw = doc.internal.pageSize.getWidth();
  const ph = doc.internal.pageSize.getHeight();
  const mx = 16; // horizontal margin
  const cw = pw - mx * 2; // content width
  const bottomSafe = ph - 18; // footer safe zone
  let y = 0;

  const today = new Date().toISOString().split("T")[0];
  const result = diagnosis.result;

  /* ── Helpers ──────────────────────────────────────────────────── */

  const fillPage = () => {
    doc.setFillColor(...PAGE_BG);
    doc.rect(0, 0, pw, ph, "F");
  };

  const newPage = () => {
    doc.addPage();
    fillPage();
    y = 16;
  };

  const ensure = (h: number) => {
    if (y + h > bottomSafe) newPage();
  };

  const wrap = (text: string, maxW: number) => doc.splitTextToSize(text, maxW) as string[];

  const signalColor = (signalId: string): [number, number, number] => {
    const sig = signals.find((s) => s.id === signalId);
    return sig ? hexToRgb(sig.domainColor) : ACCENT;
  };

  const sectionLabel = (text: string, color: [number, number, number] = ACCENT) => {
    ensure(12);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(7.5);
    doc.setTextColor(...color);
    doc.text(text, mx, y);
    y += 5;
  };

  fillPage();
  y = 26;

  /* ── Header ───────────────────────────────────────────────────── */

  doc.setFillColor(...ACCENT);
  doc.rect(mx, y, 36, 1.2, "F");
  y += 7;

  doc.setFont("helvetica", "bold");
  doc.setFontSize(19);
  doc.setTextColor(...WHITE);
  doc.text(strs.title, mx, y);
  y += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(
    strs.meta
      .replace("{contact}", diagnosis.contact_id)
      .replace("{date}", today)
      .replace("{model}", diagnosis.model ?? "—"),
    mx,
    y
  );
  y += 13;

  /* ── Verdict ──────────────────────────────────────────────────── */

  if (result && result.summary) {
    const summaryLines = wrap(result.summary, cw - 20);
    let cardH = 13 + summaryLines.length * 4.5 + (result.low_data ? 6 : 0) + 3;
    if (cardH > bottomSafe) cardH = bottomSafe - y;

    ensure(cardH);
    doc.setFillColor(...CARD_BG);
    doc.roundedRect(mx, y, cw, cardH, 2, 2, "F");
    doc.setFillColor(...ACCENT);
    doc.rect(mx, y + 2, 1.4, cardH - 4, "F");

    const cardTop = y;
    y += 5;
    sectionLabel(strs.verdict);

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...BODY);
    for (const line of summaryLines) {
      doc.text(line, mx + 8, y);
      y += 4.5;
    }

    if (result.low_data) {
      y += 1.5;
      doc.setFontSize(8);
      doc.setTextColor(245, 158, 11);
      doc.text(`${strs.bullet}${strs.lowData}`, mx + 8, y);
      y += 4.5;
    }

    y = cardTop + cardH + 8;
  }

  /* ── Stage health ─────────────────────────────────────────────── */

  if (result && result.stage_health.length > 0) {
    const rows = result.stage_health;
    const sorted = [...rows].sort((a, b) => a.score - b.score);
    const weakest = sorted[0]?.stage;

    sectionLabel(strs.stageHealth);
    const rowH = 6.4;
    ensure(rows.length * rowH);

    for (const sh of rows) {
      const name = stageNames[sh.stage] ?? sh.stage;
      const barW = cw - 46;
      const scoreColor = stageBarColor(sh.score);

      doc.setFont("helvetica", "bold");
      doc.setFontSize(8);
      doc.setTextColor(...WHITE);
      doc.text(`${sh.stage} · ${name}`.toUpperCase(), mx + 6, y);

      doc.setFillColor(40, 40, 52);
      doc.roundedRect(mx + 6, y - 2.4, barW, 1.8, 0.6, 0.6, "F");
      doc.setFillColor(...scoreColor);
      doc.roundedRect(mx + 6, y - 2.4, Math.max(barW * sh.score, 2), 1.8, 0.6, 0.6, "F");

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `${Math.round(sh.score * 100)}%${sh.stage === weakest ? ` ${strs.weakest}` : ""}`,
        mx + 8 + barW,
        y
      );
      y += rowH;
    }
    y += 5;
  }

  /* ── Findings ─────────────────────────────────────────────────── */

  sectionLabel(strs.findings);
  const findings = result?.findings ?? [];

  if (findings.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8.5);
    doc.setTextColor(...MUTED);
    doc.text(strs.noFindings, mx + 4, y);
    y += 10;
  } else {
    for (const f of findings) {
      const name = signals.find((s) => s.id === f.signal_id)?.label ?? f.signal_id;
      const lines = wrap(f.evidence ?? "", cw - 28).slice(0, 3);
      const cardH = 17 + lines.length * 4.3;
      ensure(cardH);
      const rgb = signalColor(f.signal_id);

      doc.setFillColor(...CARD_BG);
      doc.roundedRect(mx, y, cw, cardH, 2, 2, "F");
      doc.setFillColor(...rgb);
      doc.rect(mx, y + 2, 1.4, cardH - 4, "F");

      const cardTop = y;
      y += 6;

      doc.setFont("helvetica", "bold");
      doc.setFontSize(9);
      doc.setTextColor(...WHITE);
      doc.text(`${f.signal_id} — ${name}`, mx + 8, y);

      doc.setFont("helvetica", "normal");
      doc.setFontSize(7.5);
      doc.setTextColor(...MUTED);
      doc.text(
        `sev ${Math.round(f.severity * 100)}%  ·  ${Math.round(f.confidence * 100)}% ${strs.confidence}  ·  ${f.cause_code ?? "?"}`,
        mx + 8,
        y + 3.8
      );

      y += 8;
      if (lines.length > 0) {
        doc.setFontSize(8);
        doc.setTextColor(...BODY);
        doc.text(strs.evidence, mx + 8, y);
        y += 3.5;
        for (const line of lines) {
          doc.text(`${strs.bullet}${line}`, mx + 9, y);
          y += 4.3;
        }
      }

      y = cardTop + cardH + 3.5;
    }
    y += 4;
  }

  /* ── Action plan ──────────────────────────────────────────────── */

  if (plan) {
    sectionLabel(strs.planTitle);
    const items = plan.items ?? [];

    if (items.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(8.5);
      doc.setTextColor(...MUTED);
      doc.text(strs.planEmpty, mx + 4, y);
      y += 10;
    } else {
      for (const item of items) {
        const rationaleLines = wrap(item.rationale ?? "", cw - 24).slice(0, 3);
        const expectedLines = wrap(item.expected_outcome ?? "", cw - 24).slice(0, 3);
        const cardH = 16 + rationaleLines.length * 4 + expectedLines.length * 4;
        ensure(cardH);

        const pColor = priorityColor(item.priority);
        doc.setFillColor(...CARD_BG);
        doc.roundedRect(mx, y, cw, cardH, 2, 2, "F");
        doc.setFillColor(...pColor);
        doc.rect(mx, y + 2, 1.4, cardH - 4, "F");

        const cardTop = y;
        y += 5.5;

        // Rank + priority badge
        doc.setFillColor(...darken(pColor, 0.3));
        doc.roundedRect(mx + 7, y - 3.4, 12, 5.4, 1, 1, "F");
        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...WHITE);
        doc.text(item.priority, mx + 7 + 2, y);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...WHITE);
        doc.text(`${strs.rank} ${item.rank}`, mx + 24, y + 0.6);

        doc.setFont("helvetica", "bold");
        doc.setFontSize(8.5);
        doc.setTextColor(...ACCENT);
        doc.text(item.action_id, pw - mx - 7, y, { align: "right" });
        y += 5.5;

        doc.setFont("helvetica", "normal");
        doc.setFontSize(8);
        doc.setTextColor(...MUTED);
        doc.text(`stage ${item.stage}${item.requires_hitl ? `  ·  ${strs.hitl}` : ""}`, mx + 8, y);
        y += 6;

        doc.setFontSize(7.5);
        doc.setTextColor(...ACCENT);
        doc.text(strs.rationale, mx + 8, y);
        y += 3.6;
        doc.setTextColor(...BODY);
        for (const line of rationaleLines) {
          doc.text(`${strs.bullet}${line}`, mx + 9, y);
          y += 4;
        }

        doc.setTextColor(...ACCENT);
        doc.text(strs.expected, mx + 8, y);
        y += 3.6;
        doc.setTextColor(...BODY);
        for (const line of expectedLines) {
          doc.text(`${strs.bullet}${line}`, mx + 9, y);
          y += 4;
        }

        y = cardTop + cardH + 3;
      }
    }
  }

  /* ── Footer ───────────────────────────────────────────────────── */

  const pages = doc.getNumberOfPages();
  for (let i = 1; i <= pages; i++) {
    doc.setPage(i);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(7);
    doc.setTextColor(...MUTED);
    doc.text(strs.title, mx, ph - 8);
    doc.text(`${i} / ${pages}`, pw - mx, ph - 8, { align: "right" });
  }

  doc.save(`cx-diagnosis-${diagnosis.contact_id.replace(/[^a-zA-Z0-9_-]/g, "_")}-${today}.pdf`);
}
