"use client";

import { useCallback, useEffect, useState } from "react";
import {
  berthAllocationApi,
  type BerthAllocationView,
  type BerthingAllocationHistoryEntry,
} from "@/lib/api";

interface UseBerthAllocationReturn {
  slots: BerthAllocationView[];
  history: BerthingAllocationHistoryEntry[];
  loading: boolean;
  autoAllocating: boolean;
  error: string | null;
  actionMessage: string | null;
  refresh: () => Promise<void>;
  runAutoAllocation: (allocatedBy?: string) => Promise<void>;
}

export function useBerthAllocation(): UseBerthAllocationReturn {
  const [slots, setSlots] = useState<BerthAllocationView[]>([]);
  const [history, setHistory] = useState<BerthingAllocationHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [autoAllocating, setAutoAllocating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const [data, historyData] = await Promise.all([
        berthAllocationApi.getOverview(),
        berthAllocationApi.getAllocationHistory(),
      ]);
      setSlots(data);
      setHistory(historyData);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load berth allocation data";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const runAutoAllocation = useCallback(async (allocatedBy?: string) => {
    setAutoAllocating(true);
    setActionMessage(null);
    setError(null);

    try {
      const result = await berthAllocationApi.runAutoAllocation(4, allocatedBy);
      setActionMessage(
        `Auto-allocation completed: ${result.allocated}/${result.attempted} vessels assigned${
          result.failures ? `, ${result.failures} failed` : ""
        }.`
      );
      await load();
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to run auto allocation";
      setError(message);
    } finally {
      setAutoAllocating(false);
    }
  }, [load]);

  return {
    slots,
    history,
    loading,
    autoAllocating,
    error,
    actionMessage,
    refresh: load,
    runAutoAllocation,
  };
}
