"use client";

import { useState } from "react";
import { Search, BrainCog } from "lucide-react";

interface Memory {
  title: string;
  content: string;
  created_at: string;
}

export default function MemoryPage() {
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
      const res = await fetch(`/api/memory?contact_id=${encodeURIComponent(contactId.trim())}`);
      
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.details?.message || `API error: ${res.status}`);
      }

      const data = await res.json();
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
        <h1 className="text-2xl font-bold mb-2" style={{ fontFamily: "var(--font-heading)" }}>
          Contact Memory
        </h1>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
          Search for contact history and prior interventions recorded by the agent.
        </p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5" style={{ color: "var(--text-muted)" }} />
            <input
              type="text"
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              placeholder="Enter contact ID (e.g., TEST_CID_001)"
              className="w-full pl-10 pr-4 py-3 rounded-lg border"
              style={{
                backgroundColor: "var(--card)",
                borderColor: "var(--border)",
                color: "var(--text-primary)",
              }}
            />
          </div>
          <button
            type="submit"
            disabled={loading || !contactId.trim()}
            className="px-6 py-3 rounded-lg font-medium transition-colors"
            style={{
              backgroundColor: loading ? "var(--border)" : "var(--accent)",
              color: "var(--text-primary)",
              cursor: loading || !contactId.trim() ? "not-allowed" : "pointer",
            }}
          >
            {loading ? "Searching..." : "Search"}
          </button>
        </div>
      </form>

      {/* Error Display */}
      {error && (
        <div
          className="p-4 rounded-lg mb-6"
          style={{
            backgroundColor: "var(--error-bg)",
            border: "1px solid var(--error)",
            color: "var(--error)",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {/* Results */}
      {searched && !loading && (
        <div>
          {memories.length === 0 ? (
            <div
              className="p-8 rounded-lg text-center"
              style={{
                backgroundColor: "var(--card-elevated)",
                border: "1px solid var(--border)",
              }}
            >
              <p className="text-lg mb-2" style={{ color: "var(--text-secondary)" }}>
                No memory found for this contact
              </p>
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                The agent has not recorded any interventions for &quot;{contactId}&quot; yet.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                Found {memories.length} memory {memories.length === 1 ? "entry" : "entries"}
              </p>
              
              {/* Timeline */}
              <div className="space-y-0">
                {memories.map((memory, index) => {
                  const date = new Date(memory.created_at);
                  const formattedDate = date.toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  });

                  return (
                    <div
                      key={index}
                      className="p-4 rounded-lg border-l-4"
                      style={{
                        backgroundColor: "var(--card-elevated)",
                        borderColor: "var(--accent)",
                        borderLeftWidth: "4px",
                      }}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h3 className="font-medium" style={{ color: "var(--text-primary)" }}>
                          {memory.title}
                        </h3>
                        <span className="text-xs" style={{ color: "var(--text-muted)" }}>
                          {formattedDate}
                        </span>
                      </div>
                      {memory.content && (
                        <pre
                          className="text-sm whitespace-pre-wrap"
                          style={{
                            color: "var(--text-secondary)",
                            fontFamily: "var(--font-mono, monospace)",
                          }}
                        >
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
        <div
          className="p-12 rounded-lg text-center"
          style={{
            backgroundColor: "var(--card-elevated)",
            border: "1px solid var(--border)",
          }}
        >
          <BrainCog className="w-12 h-12 mx-auto mb-4" style={{ color: "var(--text-muted)" }} />
          <p className="text-lg mb-2" style={{ color: "var(--text-secondary)" }}>
            Search for a contact
          </p>
          <p className="text-sm" style={{ color: "var(--text-muted)" }}>
            Enter a contact ID above to view their memory history and prior interventions.
          </p>
        </div>
      )}
    </div>
  );
}