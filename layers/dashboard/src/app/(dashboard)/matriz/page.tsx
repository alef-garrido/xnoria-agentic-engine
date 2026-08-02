"use client";

import { MatrizDashboard } from "@/components/matriz/MatrizDashboard";
import { matrizDataEn } from "@/lib/matriz/matrizDataEn";

export default function MatrizPage() {
  return <MatrizDashboard data={matrizDataEn} />;
}
