import SignalExplorer from "@/components/signals/SignalExplorer";
import LiveSignalsPanel from "@/components/signals/LiveSignalsPanel";

export default function RadarPage() {
  return (
    <div className="flex flex-col gap-6">
      <LiveSignalsPanel />
      <SignalExplorer />
    </div>
  );
}
