"use client";

import { MatrizDashboard } from "@/features/cx-tools/matriz/components/MatrizDashboard";
import { matrizDataEn } from "@/features/cx-tools/matriz/lib/matrizDataEn";

export default function MatrizPage() {
  return <MatrizDashboard data={matrizDataEn} />;
}
