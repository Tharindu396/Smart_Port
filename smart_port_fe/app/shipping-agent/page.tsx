"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import { ApiError, vesselsApi, logisticsApi } from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { Button, Card } from "@heroui/react";
import { useEffect, useMemo, useState } from "react";

export default function ShippingAgentPage() {
  const [vessels, setVessels] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [allocating, setAllocating] = useState<Record<string, boolean>>({});
  const [message, setMessage] = useState<string | null>(null);

  const sessionUser = useMemo(() => getSessionUser(), []);
  const isAgent = sessionUser?.role === "shipping_agent";

  const load = async () => {
    setLoading(true);
    try {
      const list = await vesselsApi.getAll();
      setVessels(list);
    } catch (err) {
      // ignore here; lightweight page
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const requestAllocation = async (vessel: any) => {
    setMessage(null);
    setAllocating((s) => ({ ...s, [vessel.mmsi]: true }));
    try {
      // Request berth from logistics service only
      const logisticsPayload = {
        vesselId: String(vessel.mmsi),
        vesselName: vessel.name || `MMSI ${vessel.mmsi}`,
        length: Math.min(5, Math.max(1, Math.ceil((vessel.length ?? 180) / 80))),
        requestedByAgentId: sessionUser?.id ?? sessionUser?.email ?? "",
        depth: vessel.draft ?? 10,
      };
      const result = await logisticsApi.requestBerth(logisticsPayload);
      setMessage(`Request sent for ${logisticsPayload.vesselName}`);
      // reload vessels/slots view
      await load();
    } catch (err) {
      if (err instanceof ApiError) setMessage(err.message);
      else if (err instanceof Error) setMessage(err.message);
      else setMessage("Request failed");
    } finally {
      setAllocating((s) => ({ ...s, [vessel.mmsi]: false }));
    }
  };

  return (
    <DashboardLayout defaultActiveKey="shipping-agent" pageTitle="Shipping Agent: Request Allocation">
      <section className="space-y-6">
        <header className="rounded-2xl border border-divider p-5 md:p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-semibold">Request Berth Allocation</h2>
              <p className="mt-1 text-sm text-default-500">Select a vessel and request an allocation from berthing.</p>
            </div>
            <Button variant="secondary" onPress={load} isPending={loading}>Refresh</Button>
          </div>
        </header>

        {sessionUser && !isAgent ? (
          <Card>
            <Card.Content>
              <p className="text-lg font-semibold">Access Denied</p>
              <p className="text-sm text-default-500">This screen is only available to Shipping Agents.</p>
            </Card.Content>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {message && (
              <div className="rounded-lg border border-info/30 bg-info/5 p-3 text-sm text-info-700">{message}</div>
            )}

            {vessels.map((v) => (
              <Card key={v.mmsi}>
                <Card.Content>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{v.name || `MMSI ${v.mmsi}`}</p>
                      <p className="text-xs text-default-500">MMSI: {v.mmsi} • Status: {v.status ?? "unknown"}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        onPress={() => requestAllocation(v)}
                        isPending={!!allocating[v.mmsi]}
                      >
                        Request Allocation
                      </Button>
                    </div>
                  </div>
                </Card.Content>
              </Card>
            ))}
          </div>
        )}
      </section>
    </DashboardLayout>
  );
}
