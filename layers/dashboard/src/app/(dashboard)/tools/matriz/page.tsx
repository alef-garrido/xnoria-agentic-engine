"use client";

import { MatrizDashboard } from "@/features/cx-tools/matriz/components/MatrizDashboard";
import { resolveMatrizData } from "@/features/cx-tools/matriz/lib/matrizData";
import { getLocale } from "@/i18n/locale";

export default function MatrizPage() {
  const language = getLocale() === "es" ? "es" : "en";
  return <MatrizDashboard data={resolveMatrizData(language)} />;
}
