import SignalExplorer from "@/features/cx-tools/radar/components/signals/SignalExplorer";
import LiveSignalsPanel from "@/features/cx-tools/radar/components/signals/LiveSignalsPanel";

export default function RadarPage() {
  return (
    <div className="flex flex-col gap-6">
      <LiveSignalsPanel />
      <SignalExplorer />
    </div>
  );
}
