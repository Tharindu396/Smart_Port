"use client";

import { useCallback, useEffect, useState } from "react";
import { berthAllocationApi, type BerthAllocationView } from "@/lib/api";

interface UseBerthAllocationReturn {
  slots: BerthAllocationView[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useBerthAllocation(): UseBerthAllocationReturn {
  const [slots, setSlots] = useState<BerthAllocationView[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const data = await berthAllocationApi.getOverview();
      setSlots(data);
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

  return {
    slots,
    loading,
    error,
    refresh: load,
  };
}
