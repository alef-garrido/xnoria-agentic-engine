"use client";

import { useCallback, useEffect, useRef, useState } from "react";

interface UsePollingOptions {
  /** Poll interval in ms. Omit or pass 0 to fetch once on mount only. */
  intervalMs?: number;
  /**
   * When true (default), a failed fetch keeps the last successful data and
   * only surfaces the error state if no data has been fetched yet.
   */
  keepStaleOnError?: boolean;
}

export interface UsePollingResult<T> {
  data: T | null;
  error: boolean;
  loading: boolean;
  /** Direct state setter for optimistic updates (toggle, remove, append). */
  setData: React.Dispatch<React.SetStateAction<T | null>>;
  /** Re-run the fetcher immediately. */
  refresh: () => Promise<void>;
}

/**
 * Data-fetching hook with optional polling.
 *
 * Replaces the previous hand-rolled `useEffect + setInterval + mirror-ref`
 * pattern that was duplicated across the dashboard. The fetcher is read
 * through a ref so it may be defined inline; the effect re-runs (immediate
 * fetch + interval reset) whenever the fetcher identity changes, e.g. when a
 * caller's `useCallback` fetcher depends on new state.
 */
export function usePolling<T>(
  fetcher: () => Promise<T>,
  { intervalMs, keepStaleOnError = true }: UsePollingOptions = {}
): UsePollingResult<T> {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState(false);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const fetcherRef = useRef(fetcher);
  const dataRef = useRef<T | null>(null);

  useEffect(() => {
    fetcherRef.current = fetcher;
  }, [fetcher]);

  const refresh = useCallback(async () => {
    try {
      const next = await fetcherRef.current();
      dataRef.current = next;
      setData(next);
      setError(false);
    } catch {
      if (!keepStaleOnError || dataRef.current === null) {
        setError(true);
      }
    } finally {
      setHasLoadedOnce(true);
    }
  }, [keepStaleOnError]);

  useEffect(() => {
    void refresh();
    if (intervalMs && intervalMs > 0) {
      const id = window.setInterval(() => void refresh(), intervalMs);
      return () => window.clearInterval(id);
    }
  }, [fetcher, intervalMs, refresh]);

  return { data, error, loading: !hasLoadedOnce, setData, refresh };
}
