"use client";

import React, {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { Domain, Cause, Signal, WheelData } from "@/features/cx-tools/shared/types/wheel";
import { resolveWheelData } from "@/features/cx-tools/shared/data/wheelStructure";
import { getAllInterventions } from "@/features/cx-tools/shared/domain/interventionRegistry";

const STORAGE_WHEEL_KEY = "xnoria:editor:wheelData";
const STORAGE_INTERVENTIONS_KEY = "xnoria:editor:interventions";

export interface EditorIntervention {
  id: string;
  name: { en: string };
}

export type InterventionMap = Record<string, EditorIntervention>;

/* ─── Types ─── */
export interface EditorContextValue {
  /* State */
  domains: Domain[];
  interventions: InterventionMap;

  /* Domain CRUD */
  addDomain: (d: Domain) => void;
  updateDomain: (id: string, patch: Partial<Domain>) => void;
  deleteDomain: (id: string) => void;

  /* Cause CRUD */
  addCause: (domainId: string, c: Cause) => void;
  updateCause: (domainId: string, causeId: string, patch: Partial<Cause>) => void;
  deleteCause: (domainId: string, causeId: string) => void;

  /* Signal CRUD */
  addSignal: (domainId: string, causeId: string, s: Signal) => void;
  updateSignal: (
    domainId: string,
    causeId: string,
    signalId: string,
    patch: Partial<Signal>
  ) => void;
  deleteSignal: (domainId: string, causeId: string, signalId: string) => void;

  /* Intervention CRUD */
  addIntervention: (intervention: EditorIntervention) => void;
  updateIntervention: (id: string, patch: Partial<EditorIntervention>) => void;
  deleteIntervention: (id: string) => void;

  /* Utility */
  exportJSON: () => void;
}

const EditorContext = createContext<EditorContextValue | null>(null);

/* ─── Persistence ─── */
function loadWheelData(): WheelData {
  try {
    const raw = window.localStorage.getItem(STORAGE_WHEEL_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as WheelData;
      if (parsed && Array.isArray(parsed.domains)) return parsed;
    }
  } catch {
    /* corrupted storage — fall through to defaults */
  }
  return resolveWheelData("en");
}

function loadInterventions(): InterventionMap {
  try {
    const raw = window.localStorage.getItem(STORAGE_INTERVENTIONS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as InterventionMap;
      if (parsed && typeof parsed === "object") return parsed;
    }
  } catch {
    /* corrupted storage — fall through to defaults */
  }
  return Object.fromEntries(
    getAllInterventions().map((i) => [i.id, { id: i.id, name: { en: i.translations.en } }])
  );
}

/* ─── Helpers ─── */
function mapDomains(domains: Domain[], domainId: string, fn: (d: Domain) => Domain): Domain[] {
  return domains.map((d) => (d.id === domainId ? fn(d) : d));
}

function mapCauses(causes: Cause[], causeId: string, fn: (c: Cause) => Cause): Cause[] {
  return causes.map((c) => (c.id === causeId ? fn(c) : c));
}

/* ─── Provider ─── */
export function EditorProvider({ children }: { children: ReactNode }) {
  const [liveData, setLiveData] = useState<WheelData>(() => resolveWheelData("en"));
  const [interventionMap, setInterventionMap] = useState<InterventionMap>(() =>
    Object.fromEntries(
      getAllInterventions().map((i) => [i.id, { id: i.id, name: { en: i.translations.en } }])
    )
  );

  /* Hydrate stored data after mount (avoids SSR hydration mismatch) */
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- one-shot localStorage hydration
    setLiveData(loadWheelData());
    setInterventionMap(loadInterventions());
  }, []);

  /* Persist on every change */
  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_WHEEL_KEY, JSON.stringify(liveData));
    } catch {
      /* storage full/unavailable — skip */
    }
  }, [liveData]);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_INTERVENTIONS_KEY, JSON.stringify(interventionMap));
    } catch {
      /* storage full/unavailable — skip */
    }
  }, [interventionMap]);

  const domains = liveData.domains;
  const interventions = interventionMap;

  /* Helper to push domain-level changes back into liveData */
  const commitDomains = useCallback((updater: (prev: Domain[]) => Domain[]) => {
    setLiveData((prev) => ({ ...prev, domains: updater(prev.domains) }));
  }, []);

  /* ── Domain CRUD ── */
  const addDomain = useCallback(
    (d: Domain) => {
      commitDomains((prev) => [...prev, d]);
    },
    [commitDomains]
  );

  const updateDomain = useCallback(
    (id: string, patch: Partial<Domain>) => {
      commitDomains((prev) => mapDomains(prev, id, (d) => ({ ...d, ...patch })));
    },
    [commitDomains]
  );

  const deleteDomain = useCallback(
    (id: string) => {
      commitDomains((prev) => prev.filter((d) => d.id !== id));
    },
    [commitDomains]
  );

  /* ── Cause CRUD ── */
  const addCause = useCallback(
    (domainId: string, c: Cause) => {
      commitDomains((prev) =>
        mapDomains(prev, domainId, (d) => ({
          ...d,
          causes: [...d.causes, c],
        }))
      );
    },
    [commitDomains]
  );

  const updateCause = useCallback(
    (domainId: string, causeId: string, patch: Partial<Cause>) => {
      commitDomains((prev) =>
        mapDomains(prev, domainId, (d) => ({
          ...d,
          causes: mapCauses(d.causes, causeId, (c) => ({ ...c, ...patch })),
        }))
      );
    },
    [commitDomains]
  );

  const deleteCause = useCallback(
    (domainId: string, causeId: string) => {
      commitDomains((prev) =>
        mapDomains(prev, domainId, (d) => ({
          ...d,
          causes: d.causes.filter((c) => c.id !== causeId),
        }))
      );
    },
    [commitDomains]
  );

  /* ── Signal CRUD ── */
  const addSignal = useCallback(
    (domainId: string, causeId: string, s: Signal) => {
      commitDomains((prev) =>
        mapDomains(prev, domainId, (d) => ({
          ...d,
          causes: mapCauses(d.causes, causeId, (c) => ({
            ...c,
            signals: [...c.signals, s],
          })),
        }))
      );
    },
    [commitDomains]
  );

  const updateSignal = useCallback(
    (domainId: string, causeId: string, signalId: string, patch: Partial<Signal>) => {
      commitDomains((prev) =>
        mapDomains(prev, domainId, (d) => ({
          ...d,
          causes: mapCauses(d.causes, causeId, (c) => ({
            ...c,
            signals: c.signals.map((s) => (s.id === signalId ? { ...s, ...patch } : s)),
          })),
        }))
      );
    },
    [commitDomains]
  );

  const deleteSignal = useCallback(
    (domainId: string, causeId: string, signalId: string) => {
      commitDomains((prev) =>
        mapDomains(prev, domainId, (d) => ({
          ...d,
          causes: mapCauses(d.causes, causeId, (c) => ({
            ...c,
            signals: c.signals.filter((s) => s.id !== signalId),
          })),
        }))
      );
    },
    [commitDomains]
  );

  /* ── Intervention CRUD ── */
  const addIntervention = useCallback((intervention: EditorIntervention) => {
    setInterventionMap((prev) => ({ ...prev, [intervention.id]: intervention }));
  }, []);

  const updateIntervention = useCallback((id: string, patch: Partial<EditorIntervention>) => {
    setInterventionMap((prev) => {
      const existing = prev[id];
      if (!existing) return prev;
      const updated = { ...existing, ...patch };
      if (patch.id && patch.id !== id) {
        const rest = Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id));
        return { ...rest, [patch.id]: updated };
      }
      return { ...prev, [id]: updated };
    });
  }, []);

  const deleteIntervention = useCallback((id: string) => {
    setInterventionMap((prev) =>
      Object.fromEntries(Object.entries(prev).filter(([k]) => k !== id))
    );
  }, []);

  /* ── Export ── */
  const exportJSON = useCallback(() => {
    const payload = {
      wheelData: liveData,
      interventionRegistry: interventionMap,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cx-taxonomy-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [liveData, interventionMap]);

  return (
    <EditorContext.Provider
      value={{
        domains,
        interventions,
        addDomain,
        updateDomain,
        deleteDomain,
        addCause,
        updateCause,
        deleteCause,
        addSignal,
        updateSignal,
        deleteSignal,
        addIntervention,
        updateIntervention,
        deleteIntervention,
        exportJSON,
      }}
    >
      {children}
    </EditorContext.Provider>
  );
}

export function useEditor() {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("useEditor must be used within EditorProvider");
  return ctx;
}
