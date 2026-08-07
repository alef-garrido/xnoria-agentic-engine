/**
 * compassStrings.ts — Compass UI labels + domain prefix lookup.
 *
 * The wheel dataset itself lives in wheelStructure.ts (canonical, locale-aware).
 * This file only holds the compass chrome strings (not duplicated in
 * translations.ts) and the domain id → stage-code prefix map.
 */

export const domainPrefixesEn: Record<string, string> = {
  acquisition: "ACQ",
  sales: "SAL",
  onboarding: "ONB",
  product: "PRD",
  support: "SUP",
  communication: "COM",
  retention: "RET",
  expansion: "EXP",
};

export const uiStringsEn = {
  signals: "Signals",
  indicators: "Key Indicators",
  interventions: "Suggested Interventions",
  backToOverview: "Back to Overview",
  searchPlaceholder: "Search domains, causes, signals...",
  noResults: "No results found for",
  legend: "Legend",
  causeCodeSystem: "Cause Code System",
  home: "Home",
};

export const uiStringsEs = {
  signals: "Señales",
  indicators: "Indicadores Clave",
  interventions: "Intervenciones Sugeridas",
  backToOverview: "Volver al Resumen",
  searchPlaceholder: "Buscar dominios, causas, señales...",
  noResults: "Sin resultados para",
  legend: "Leyenda",
  causeCodeSystem: "Sistema de Códigos de Causa",
  home: "Inicio",
};
