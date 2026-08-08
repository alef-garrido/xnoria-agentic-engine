"use client";

import { useState } from "react";
import SignalExplorer from "@/features/cx-tools/radar/components/signals/SignalExplorer";
import LiveSignalsPanel from "@/features/cx-tools/radar/components/signals/LiveSignalsPanel";
import DiagnosisPanel from "@/features/cx-tools/radar/components/diagnosis/DiagnosisPanel";

export default function RadarPage() {
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);

  return (
    <div className="flex flex-col gap-6">
      <LiveSignalsPanel
        selectedContactId={selectedContactId}
        onSelectContact={setSelectedContactId}
      />
      <DiagnosisPanel contactId={selectedContactId} />
      <SignalExplorer />
    </div>
  );
}
