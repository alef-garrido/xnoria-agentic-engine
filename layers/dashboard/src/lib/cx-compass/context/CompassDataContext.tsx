"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type { WheelData } from "@/lib/cx-compass/types/wheel";
import { getAllInterventions, type Intervention } from "@/lib/radar/domain/interventionRegistry";
import { wheelDataEn, uiStringsEn, domainPrefixesEn } from "@/lib/cx-compass/data/wheelDataEn";

export interface UiStrings {
    signals: string;
    indicators: string;
    interventions: string;
    backToOverview: string;
    searchPlaceholder: string;
    noResults: string;
    legend: string;
    causeCodeSystem: string;
    home: string;
}

interface CompassDataContextValue {
    wheelData: WheelData;
    uiStrings: UiStrings;
    domainPrefixes: Record<string, string>;
    getIntervention: (id: string) => NamedIntervention | undefined;
}

export type NamedIntervention = Intervention & { name: string };

const CompassDataContext = createContext<CompassDataContextValue | null>(null);

export function CompassDataProvider({ children }: { children: ReactNode }) {
    const interventionMap = useMemo(() => {
        const map: Record<string, NamedIntervention> = {};
        for (const intervention of getAllInterventions()) {
            map[intervention.id] = {
                ...intervention,
                name: intervention.translations.en,
            };
        }
        return map;
    }, []);

    const value = useMemo<CompassDataContextValue>(() => ({
        wheelData: wheelDataEn,
        uiStrings: uiStringsEn,
        domainPrefixes: domainPrefixesEn,
        getIntervention: (id: string) => interventionMap[id],
    }), [interventionMap]);

    return (
        <CompassDataContext.Provider value={value}>
            {children}
        </CompassDataContext.Provider>
    );
}

export function useCompassData() {
    const ctx = useContext(CompassDataContext);
    if (!ctx) throw new Error("useCompassData must be used within CompassDataProvider");
    return ctx;
}
