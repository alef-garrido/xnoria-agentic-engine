import { useMemo } from "react";
import { mapSignalsToRadar } from "@/lib/radar/engine/radarMapping";
import { RadarSignal, RadarConfig, DomainID } from "@/lib/radar/types/radar";

export function useRadarLayout({
    signals,
    domains,
    config,
}: {
    signals: RadarSignal[];
    domains: { id: DomainID; color: string }[];
    config: RadarConfig;
}) {
    return useMemo(() => {
        return mapSignalsToRadar(signals, domains, config);
    }, [signals, domains, config]);
}
