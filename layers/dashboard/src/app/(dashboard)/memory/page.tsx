"use client";

import { useState } from "react";
import { Search, BrainCog } from "lucide-react";
import { useTranslations } from "next-intl";
import { getLocale } from "@/i18n/locale";
import { apiFetch } from "@/lib/client-api";

interface Memory {
  title: string;
  content: string;
  created_at: string;
}

export default function MemoryPage() {
  const t = useTranslations("memory");
  const [contactId, setContactId] = useState("");
  const [memories, setMemories] = useState<Memory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactId.trim()) return;

    setLoading(true);
    setError(null);
    setSearched(true);

    try {
      const data = await apiFetch<{ memories?: Memory[] }>(
        `/api/memory?contact_id=${encodeURIComponent(contactId.trim())}`
      );
      setMemories(data.memories || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch memory");
      setMemories([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold mb-2 font-[var(--font-heading)] text-[var(--text-primary)]">
          {t("title")}
        </h1>
        <p className="text-sm text-[var(--text-muted)]">{t("subtitle")}</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--text-muted)]" />
            <input
              type="text"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              placeholder={t("placeholder")}
              className="w-full pl-10 pr-4 py-3 rounded-lg border bg-[var(--card)] border-[var(--border)] text-[var(--text-primary)]"
            />
          </div>
          <button
            type="submit"
            disabled={loading || !contactId.trim()}
            className="px-6 py-3 rounded-lg font-medium transition-colors text-[var(--text-primary)]"
            style={{
              backgroundColor: loading ? "var(--border)" : "var(--accent)",
              cursor: loading || !contactId.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? t("searching") : t("search")}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg mb-6 bg-[var(--negative-soft)] border border-[var(--negative)] text-[var(--negative)]">
          <strong>{t("error")}:</strong> {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div>
          {memories.length === 0 ? (
            <div className="p-8 rounded-lg text-center bg-[var(--card-elevated)] border border-[var(--border)]">
              <p className="text-lg mb-2 text-[var(--text-secondary)]">{t("noMemory")}</p>
              <p className="text-sm text-[var(--text-muted)]">
                {t("noMemoryDetail", { contactId })}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm text-[var(--text-muted)]">
                {t("found", { count: memories.length })}
              </p>

              {/* Timeline */}
              <div className="space-y-0">
                {memories.map((memory, index) => {
                  const date = new Date(memory.created_at);
                  const formattedDate = date.toLocaleDateString(
                    getLocale() === "es" ? "es-AR" : "en-US",
                    {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    }
                  );

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-lg border-l-4 bg-[var(--card-elevated)] border-l-[var(--accent)]"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium text-[var(--text-primary)]">{memory.title}</h3>
                        <span className="text-xs text-[var(--text-muted)]">{formattedDate}</span>
                      </div>
                      {memory.content && (
                        <pre className="text-sm whitespace-pre-wrap text-[var(--text-secondary)] font-[var(--font-mono)]">
                          {memory.content}
                        </pre>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Initial State */}
      {!searched && !loading && (
        <div className="p-12 rounded-lg text-center bg-[var(--card-elevated)] border border-[var(--border)]">
          <BrainCog className="w-12 h-12 mx-auto mb-4 text-[var(--text-muted)]" />
          <p className="text-lg mb-2 text-[var(--text-secondary)]">{t("searchForContact")}</p>
          <p className="text-sm text-[var(--text-muted)]">{t("initialHint")}</p>
        </div>
      )}
    </div>
  );
}
