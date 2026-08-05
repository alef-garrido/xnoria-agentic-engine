// ==============================================================================
// Exnoria · Dashboard · Locale
// One deployment = one language. NEXT_PUBLIC_APP_LOCALE (en | es) is inlined
// at build time from APP_LOCALE. No runtime switching.
// ==============================================================================

export type Locale = "en" | "es";

export function getLocale(): Locale {
  const raw = process.env.NEXT_PUBLIC_APP_LOCALE ?? "en";
  return raw === "es" ? "es" : "en";
}

export const LOCALE = getLocale();
