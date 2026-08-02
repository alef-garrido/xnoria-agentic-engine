"use client";

import { useState, useEffect, useCallback } from "react";
import { formatDistanceToNow } from "date-fns";
import { Activity, Users, Radio, AlertTriangle } from "lucide-react";
import { clientLogger } from "@/lib/client-logger";

interface RadarContact {
  contact_id: string;
  channel: string;
  stage: string | null;
  signal_id: string | null;
  signal_severity: number | null;
  cause_code: string | null;
  last_seen: string;
  session_count: number;
}

interface RadarSignalEvent {
  session_id: string;
  channel: string;
  stage: string | null;
  signal_id: string;
  signal_severity: number | null;
  cause_code: string | null;
  input: string;
  created_at: string;
}

const POLL_MS = 10_000;

function severityColor(severity: number | null): string {
  if (severity === null) return "var(--text-muted)";
  if (severity >= 0.8) return "#f87171";
  if (severity >= 0.5) return "#facc15";
  return "#4ade80";
}

function timeAgo(iso: string): string {
  try {
    return formatDistanceToNow(new Date(iso), { addSuffix: true });
  } catch {
    return iso;
  }
}

export default function LiveSignalsPanel() {
  const [contacts, setContacts] = useState<RadarContact[]>([]);
  const [selectedContact, setSelectedContact] = useState<string | null>(null);
  const [signals, setSignals] = useState<RadarSignalEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  const fetchContacts = useCallback(async () => {
    try {
      const res = await fetch("/api/radar/contacts");
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setContacts(data.contacts ?? []);
      setError(null);
      setLastUpdated(new Date());
    } catch (err) {
      clientLogger.error("Failed to fetch radar contacts", { err });
      setError("Could not reach the radar data feed.");
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchSignals = useCallback(async (contactId: string) => {
    try {
      const res = await fetch(`/api/radar/signals?contactId=${encodeURIComponent(contactId)}`);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      setSignals(data.signals ?? []);
    } catch (err) {
      clientLogger.error("Failed to fetch radar signals", { err, contactId });
      setSignals([]);
    }
  }, []);

  useEffect(() => {
    const initial = setTimeout(fetchContacts, 0);
    const interval = setInterval(fetchContacts, POLL_MS);
    return () => {
      clearTimeout(initial);
      clearInterval(interval);
    };
  }, [fetchContacts]);

  useEffect(() => {
    if (selectedContact) {
      const timer = setTimeout(() => fetchSignals(selectedContact), 0);
      return () => clearTimeout(timer);
    }
  }, [selectedContact, fetchSignals]);

  const selected = contacts.find((c) => c.contact_id === selectedContact) ?? null;

  return (
    <section
      className="rounded-2xl"
      style={{ backgroundColor: "var(--card)", border: "1px solid var(--border)" }}
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-5 pb-4">
        <div className="flex items-center gap-3">
          <div
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ backgroundColor: "var(--accent-soft)" }}
          >
            <Radio className="w-4 h-4" style={{ color: "var(--accent)" }} />
          </div>
          <div>
            <h2
              className="text-sm font-bold"
              style={{ fontFamily: "var(--font-heading)", color: "var(--text-primary)" }}
            >
              Live Contact Signals
            </h2>
            <p className="text-xs" style={{ color: "var(--text-muted)" }}>
              Signal detection streamed from cognitive sessions
              {lastUpdated && (
                <span className="ml-1">
                  — updated {timeAgo(lastUpdated.toISOString())}
                </span>
              )}
            </p>
          </div>
        </div>
        <div
          className="flex items-center gap-2 text-xs font-mono px-2.5 py-1 rounded-full"
          style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)", color: "var(--text-secondary)" }}
        >
          <span
            className="w-2 h-2 rounded-full animate-pulse"
            style={{
              backgroundColor: loading ? "var(--text-muted)" : contacts.length > 0 ? "#4ade80" : "#facc15",
            }}
          />
          {contacts.length} tracked {contacts.length === 1 ? "contact" : "contacts"}
        </div>
      </div>

      {/* Body */}
      <div className="grid lg:grid-cols-2 gap-0 lg:gap-6 p-5 pt-0">
        {/* Contacts list */}
        <div className="flex flex-col min-h-[220px]">
          <div className="flex items-center gap-2 mb-2 text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
            <Users className="w-3 h-3" /> Contacts
          </div>
          {loading ? (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              Loading...
            </div>
          ) : error ? (
            <div className="flex-1 flex items-center justify-center gap-2 text-sm" style={{ color: "var(--accent)" }}>
              <AlertTriangle className="w-4 h-4" /> {error}
            </div>
          ) : contacts.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center max-w-[320px] p-4">
                <Activity className="w-8 h-8 mx-auto mb-3 opacity-40" style={{ color: "var(--text-muted)" }} />
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  No signals detected yet.
                </p>
                <p className="text-xs mt-1 leading-relaxed" style={{ color: "var(--text-muted)" }}>
                  When the cognitive layer processes Compass-annotated events
                  (signal_id, severity, cause_code), detected signals appear here in
                  real time.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[360px] pr-1">
              {contacts.map((c) => (
                <button
                  key={c.contact_id}
                  onClick={() => setSelectedContact(c.contact_id)}
                  className="text-left rounded-xl p-3 transition-colors"
                  style={{
                    backgroundColor: selectedContact === c.contact_id ? "var(--card-elevated)" : "transparent",
                    border: `1px solid ${selectedContact === c.contact_id ? "var(--border-strong)" : "var(--border)"}`,
                  }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-semibold truncate" style={{ color: "var(--text-primary)" }}>
                      {c.contact_id}
                    </span>
                    <span
                      className="text-[10px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded"
                      style={{ backgroundColor: "var(--accent-soft)", color: "var(--accent)" }}
                    >
                      {c.signal_id ?? "—"}
                    </span>
                  </div>
                  <div className="flex items-center justify-between mt-1.5">
                    <span className="text-[10px] font-mono" style={{ color: "var(--text-muted)" }}>
                      {c.stage ?? "?"} · {c.cause_code ?? "?"} · {c.session_count} sessions
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(c.last_seen)}
                    </span>
                  </div>
                  <div className="mt-1.5 h-1 rounded-full overflow-hidden" style={{ backgroundColor: "var(--border)" }}>
                    <div
                      className="h-full rounded-full"
                      style={{
                        width: `${Math.round((c.signal_severity ?? 0) * 100)}%`,
                        backgroundColor: severityColor(c.signal_severity),
                      }}
                    />
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Signal history */}
        <div className="flex flex-col min-h-[220px] border-t lg:border-t-0 lg:border-l border-[var(--border)] pt-4 lg:pt-0 lg:pl-6">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest font-bold" style={{ color: "var(--text-muted)" }}>
              <Radio className="w-3 h-3" /> Signal History
            </div>
            {selected && (
              <span className="font-mono text-[10px]" style={{ color: "var(--text-secondary)" }}>
                {selected.contact_id}
              </span>
            )}
          </div>
          {!selected ? (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              Select a contact to view its detected signals.
            </div>
          ) : signals.length === 0 ? (
            <div className="flex-1 flex items-center justify-center text-sm" style={{ color: "var(--text-muted)" }}>
              No signal events recorded for this contact.
            </div>
          ) : (
            <div className="flex flex-col gap-1.5 overflow-y-auto max-h-[360px] pr-1">
              {signals.map((s) => (
                <div
                  key={s.session_id}
                  className="rounded-xl p-3"
                  style={{ backgroundColor: "var(--card-elevated)", border: "1px solid var(--border)" }}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-mono text-xs font-bold" style={{ color: severityColor(s.signal_severity) }}>
                      {s.signal_id}
                    </span>
                    <span className="text-[10px]" style={{ color: "var(--text-muted)" }}>
                      {timeAgo(s.created_at)}
                    </span>
                  </div>
                  <div className="mt-1 text-[10px] font-mono" style={{ color: "var(--text-secondary)" }}>
                    {s.cause_code ?? "?"} · {s.stage ?? "?"} · {s.channel}
                    {s.signal_severity !== null && (
                      <> · severity {Math.round(s.signal_severity * 100)}%</>
                    )}
                  </div>
                  <p className="mt-1.5 text-xs leading-relaxed line-clamp-2" style={{ color: "var(--text-muted)" }}>
                    {s.input}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
