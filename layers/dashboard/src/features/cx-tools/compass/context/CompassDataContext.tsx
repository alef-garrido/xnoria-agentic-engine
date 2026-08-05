"use client";

import React, { createContext, useContext, useMemo, type ReactNode } from "react";
import type { WheelData } from "@/features/cx-tools/shared/types/wheel";
import { getAllInterventions, type Intervention } from "@/features/cx-tools/shared/domain/interventionRegistry";
import { resolveWheelData } from "@/features/cx-tools/shared/data/wheelStructure";
import { uiStringsEn, uiStringsEs, domainPrefixesEn } from "@/features/cx-tools/shared/data/wheelDataEn";
import { getLocale } from "@/i18n/locale";

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
    const locale = getLocale() === "es" ? "es" : "en";

    const interventionMap = useMemo(() => {
        const map: Record<string, NamedIntervention> = {};
        for (const intervention of getAllInterventions()) {
            map[intervention.id] = {
                ...intervention,
                name: intervention.translations[locale] || intervention.translations.en,
            };
        }
        return map;
    }, [locale]);

    const value = useMemo<CompassDataContextValue>(() => ({
        wheelData: resolveWheelData(locale),
        uiStrings: locale === "es" ? uiStringsEs : uiStringsEn,
        domainPrefixes: domainPrefixesEn,
        getIntervention: (id: string) => interventionMap[id],
    }), [locale, interventionMap]);

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
