"use client";

import { useEffect, useState } from "react";
import { formatDistanceToNow, format } from "date-fns";
import { History as HistoryIcon, MessagesSquare, ChevronDown, ChevronUp, Loader2 } from "lucide-react";

interface Session {
  id: string;
  contact_id: string;
  channel: string;
  stage: string;
  input: string;
  actions_taken: number;
  model: string;
  created_at: string;
}

interface HistoryMessage {
  id: string;
  role: string;
  content: string;
  created_at: string;
}

interface SessionsResponse {
  sessions: Session[];
  total: number;
  page: number;
  hasMore: boolean;
}

function SessionRow({ session }: { session: Session }) {
  const [expanded, setExpanded] = useState(false);
  const [history, setHistory] = useState<HistoryMessage[] | null>(null);
  const [loading, setLoading] = useState(false);

  const toggleExpand = async () => {
    if (!expanded && !history) {
      setLoading(true);
      try {
        const res = await fetch(`/api/sessions/${session.id}`);
        if (res.ok) {
          const data = await res.json();
          setHistory(data.history);
        }
      } catch (err) {
        console.error("Failed to load history", err);
      }
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  return (
    <div 
      className="border-b transition-colors last:border-0"
      style={{ borderColor: 'var(--border)' }}
    >
      <div 
        className="flex items-center justify-between p-4 cursor-pointer hover:bg-opacity-50"
        style={{ backgroundColor: expanded ? 'var(--card-elevated)' : 'transparent' }}
        onClick={toggleExpand}
      >
        <div className="flex-1 min-w-0 pr-4 flex flex-col gap-1.5 md:flex-row md:items-center md:gap-4">
          {/* Header row 1 on mobile, left block on desktop */}
          <div className="flex items-center gap-2">
            <span 
              className="text-xs font-semibold px-2 py-0.5 rounded"
              style={{ backgroundColor: 'var(--accent-soft)', color: 'var(--accent)' }}
            >
              {session.channel}
            </span>
            <span 
              className="text-xs px-2 py-0.5 rounded outline outline-1"
              style={{ color: 'var(--text-secondary)', outlineColor: 'var(--border)' }}
            >
              {session.stage}
            </span>
            <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
              {session.contact_id}
            </span>
          </div>

          {/* Truncated input */}
          <div className="flex-1 truncate text-sm" style={{ color: 'var(--text-primary)' }}>
            "{session.input.length > 80 ? session.input.substring(0, 80) + '...' : session.input}"
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap items-center gap-3 text-xs" style={{ color: 'var(--text-muted)' }}>
            <span className="flex items-center gap-1">
              <MessagesSquare className="w-3.5 h-3.5" />
              {session.actions_taken} actions
            </span>
            <span className="hidden md:inline-block">🤖 {session.model}</span>
            <span>{formatDistanceToNow(new Date(session.created_at), { addSuffix: true })}</span>
          </div>
        </div>

        <div className="flex-shrink-0 text-gray-500">
          {expanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </div>
      </div>

      {expanded && (
        <div 
          className="p-4"
          style={{ backgroundColor: 'var(--background)' }}
        >
          {loading && (
            <div className="flex items-center justify-center p-4">
              <Loader2 className="w-5 h-5 animate-spin" style={{ color: 'var(--accent)' }} />
            </div>
          )}

          {history && history.length === 0 && (
            <div className="text-sm text-center p-4" style={{ color: 'var(--text-muted)' }}>
              No history messages found for this session.
            </div>
          )}

          {history && history.length > 0 && (
            <div className="space-y-3">
              {history.map((msg) => (
                <div 
                  key={msg.id || msg.created_at} 
                  className={`flex flex-col gap-1 p-3 rounded-lg text-sm max-w-[85%] ${msg.role === 'user' ? 'ml-auto' : 'mr-auto'}`}
                  style={{ 
                    backgroundColor: msg.role === 'user' ? 'var(--accent)' : 'var(--card-elevated)',
                    color: msg.role === 'user' ? '#fff' : 'var(--text-primary)'
                  }}
                >
                  <div className="flex justify-between items-center gap-4 text-[10px] opacity-75 font-semibold">
                    <span className="uppercase">{msg.role}</span>
                    <span>{format(new Date(msg.created_at), 'HH:mm:ss')}</span>
                  </div>
                  <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<Session[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        const res = await fetch(`/api/sessions?limit=25&page=1`);
        if (!res.ok) throw new Error("Failed");
        const data: SessionsResponse = await res.json();
        setSessions(data.sessions);
        setError(false);
      } catch (err) {
        if (!sessions) setError(true);
      }
    };

    fetchSessions();
    const interval = setInterval(fetchSessions, 10000); // Poll every 10 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-2">
        <h1 
          className="text-2xl font-bold tracking-tight"
          style={{ 
            fontFamily: 'var(--font-heading)',
            color: 'var(--text-primary)'
          }}
        >
          Session History
        </h1>
      </div>
      
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--border)', backgroundColor: 'var(--card)' }}>
        {error && (
          <div className="text-center py-12" style={{ color: 'var(--error)' }}>
            <p>Failed to load sessions</p>
          </div>
        )}

        {!error && !sessions && (
          <div className="animate-pulse">
            {[...Array(5)].map((_, i) => (
              <div 
                key={i} 
                className="h-16 mx-4 my-2 rounded-lg"
                style={{ backgroundColor: 'var(--card-elevated)' }}
              />
            ))}
          </div>
        )}

        {sessions && sessions.length === 0 && (
          <div className="text-center py-12" style={{ color: 'var(--text-secondary)' }}>
            <HistoryIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No sessions logged yet</p>
          </div>
        )}

        {sessions && sessions.length > 0 && (
          <div className="flex flex-col">
            {sessions.map((session) => (
              <SessionRow key={session.id} session={session} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
