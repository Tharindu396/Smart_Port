"use client";

import { DashboardLayout } from "@/app/components/DashboardLayout";
import {
  ApiError,
  invoicesApi,
  logisticsApi,
  type InvoiceDto,
  type InvoiceStatus,
  type LogisticsVesselVisitDto,
} from "@/lib/api";
import { getSessionUser } from "@/lib/auth/session";
import { Button, Card, Chip, Input, ProgressBar as Progress } from "@heroui/react";
import {
  BadgeDollarSign,
  CalendarClock,
  CircleAlert,
  FileSpreadsheet,
  HandCoins,
  RefreshCw,
  Search,
  Sparkles,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";

type AutoDraft = {
  key: string;
  vesselId: string;
  vesselName: string;
  rule: string;
  amount: number;
  confidence: number;
  status: "ready" | "review";
};

type InvoiceFilter = "ALL" | InvoiceStatus;

function toMoney(amount: number, currency = "USD"): string {
  return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(Number(amount || 0));
}

function toDate(input?: string): string {
  if (!input) return "N/A";
  const date = new Date(input);
  if (Number.isNaN(date.getTime())) return "N/A";
  return date.toLocaleString();
}

function statusChip(status: InvoiceStatus): { color: "warning" | "success" | "danger" | "default"; label: string } {
  if (status === "PENDING") return { color: "warning", label: "Pending" };
  if (status === "PAID") return { color: "success", label: "Paid" };
  if (status === "CANCELLED") return { color: "danger", label: "Cancelled" };
  return { color: "default", label: "Overdue" };
}

function draftFromVisit(visit: LogisticsVesselVisitDto): AutoDraft {
  const berthBase = Math.max(visit.length, 80) * 4.35;
  const depthAdj = Math.max(visit.depth, 5) * 38;
  const riskFactor = visit.status.includes("PENDING") ? 1.08 : 1;
  const amount = Number((berthBase + depthAdj) * riskFactor);

  return {
    key: visit.id,
    vesselId: visit.vesselId,
    vesselName: visit.vesselName,
    rule: visit.status.includes("PENDING") ? "Pending allocation surcharge" : "Standard berth tariff",
    amount,
    confidence: visit.status.includes("PENDING") ? 72 : 89,
    status: visit.status.includes("PENDING") ? "review" : "ready",
  };
}

export default function InvoicePage() {
  const [invoices, setInvoices] = useState<InvoiceDto[]>([]);
  const [drafts, setDrafts] = useState<AutoDraft[]>([]);
  const [loading, setLoading] = useState(true);
  const [runningEngine, setRunningEngine] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [engineNote, setEngineNote] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<InvoiceFilter>("ALL");

  const user = useMemo(() => getSessionUser(), []);
  const canOperateBilling = user?.role === "admin" || user?.role === "finance_officer";

  const loadInvoices = async () => {
    setLoading(true);
    setInvoiceError(null);

    try {
      const response = await invoicesApi.getAll(statusFilter === "ALL" ? undefined : statusFilter);
      setInvoices(response.invoices || []);
    } catch (err) {
      if (err instanceof ApiError || err instanceof Error) {
        setInvoiceError("Unable to reach invoice-service right now.");
      } else {
        setInvoiceError("Failed to load invoices.");
      }
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  };

  const runAutoBilling = async () => {
    setRunningEngine(true);
    setEngineNote(null);

    try {
      const visits = await logisticsApi.getVesselVisits();
      const alreadyBilled = new Set(invoices.map((invoice) => invoice.vesselId));
      const generated = visits
        .filter((visit) => !alreadyBilled.has(visit.vesselId))
        .map(draftFromVisit)
        .sort((a, b) => b.amount - a.amount);

      setDrafts(generated);
      setEngineNote(
        generated.length > 0
          ? `Generated ${generated.length} automated billing drafts from logistics-service records.`
          : "No new vessels need draft billing at the moment."
      );
    } catch {
      setEngineNote("Auto-billing engine could not fetch logistics-service data.");
      setDrafts([]);
    } finally {
      setRunningEngine(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, [statusFilter]);

  const filteredInvoices = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return invoices;

    return invoices.filter((invoice) => {
      return [invoice.id, invoice.vesselId, invoice.vesselName, invoice.status, invoice.paymentStatus]
        .join(" ")
        .toLowerCase()
        .includes(needle);
    });
  }, [invoices, search]);

  const summary = useMemo(() => {
    const pending = invoices.filter((invoice) => invoice.status === "PENDING").length;
    const paid = invoices.filter((invoice) => invoice.status === "PAID").length;
    const overdue = invoices.filter((invoice) => invoice.status === "OVERDUE").length;
    const totalRevenue = invoices.reduce((sum, invoice) => sum + Number(invoice.totalAmount || 0), 0);
    return { pending, paid, overdue, totalRevenue };
  }, [invoices]);

  return (
    <DashboardLayout defaultActiveKey="invoice" pageTitle="Automated Billing">
      <section className="space-y-6">
        <header className="rounded-2xl border border-divider bg-linear-to-r from-content2 via-content1 to-warning/10 p-5 md:p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 rounded-full bg-warning-soft px-3 py-1 text-xs font-medium text-warning-700">
                <Sparkles size={14} />
                Invoice Automation
              </div>
              <h2 className="text-2xl font-semibold tracking-tight md:text-3xl">Automated Billing Control Room</h2>
              <p className="max-w-2xl text-sm text-default-500 md:text-base">
                Monitor invoice-service output and generate draft billing recommendations for newly arrived vessels.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Chip color={canOperateBilling ? "success" : "warning"} variant="soft">
                {canOperateBilling ? "Finance Access" : "Read-only Access"}
              </Chip>
              <Button variant="secondary" onPress={loadInvoices} isPending={loading}>
                <RefreshCw size={16} />
                Refresh Invoices
              </Button>
              <Button
                variant="primary"
                onPress={runAutoBilling}
                isPending={runningEngine}
                isDisabled={!canOperateBilling}
              >
                <FileSpreadsheet size={16} />
                Generate Draft Billing
              </Button>
            </div>
          </div>
        </header>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <BadgeDollarSign size={14} />
                <p className="text-xs uppercase">Pending Invoices</p>
              </div>
              <p className="text-2xl font-bold">{summary.pending}</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <HandCoins size={14} />
                <p className="text-xs uppercase">Paid</p>
              </div>
              <p className="text-2xl font-bold">{summary.paid}</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <CircleAlert size={14} />
                <p className="text-xs uppercase">Overdue</p>
              </div>
              <p className="text-2xl font-bold">{summary.overdue}</p>
            </Card.Content>
          </Card>

          <Card>
            <Card.Content className="space-y-2">
              <div className="flex items-center gap-2 text-default-500">
                <CalendarClock size={14} />
                <p className="text-xs uppercase">Total Booked</p>
              </div>
              <p className="text-2xl font-bold">{toMoney(summary.totalRevenue)}</p>
            </Card.Content>
          </Card>
        </div>

        {invoiceError && (
          <Card>
            <Card.Content className="text-sm text-danger-600">{invoiceError}</Card.Content>
          </Card>
        )}

        {engineNote && (
          <Card>
            <Card.Content className="text-sm text-accent-700">{engineNote}</Card.Content>
          </Card>
        )}

        <Card>
          <Card.Content className="space-y-4">
            <div className="grid grid-cols-1 gap-3 lg:grid-cols-3">
              <div className="relative lg:col-span-2">
                <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-default-400" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search invoice ID, vessel, status, payment state"
                  className="pl-8"
                />
              </div>

              <select
                className="h-10 rounded-lg border border-divider bg-content1 px-3 text-sm text-foreground outline-none transition focus:border-primary"
                value={statusFilter}
                onChange={(event) => setStatusFilter(event.target.value as InvoiceFilter)}
              >
                <option value="ALL">All statuses</option>
                <option value="PENDING">Pending</option>
                <option value="PAID">Paid</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="OVERDUE">Overdue</option>
              </select>
            </div>

            {loading ? (
              <div className="rounded-lg border border-divider p-4 text-sm text-default-500">Loading invoices from invoice-service...</div>
            ) : filteredInvoices.length === 0 ? (
              <div className="rounded-lg border border-divider p-4 text-sm text-default-500">No invoices matched the selected filters.</div>
            ) : (
              <div className="space-y-3">
                {filteredInvoices.map((invoice) => {
                  const meta = statusChip(invoice.status);
                  return (
                    <article key={invoice.id} className="rounded-xl border border-divider bg-content2/40 p-4 transition-colors hover:bg-content2">
                      <div className="mb-3 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                        <div>
                          <p className="text-base font-semibold">Invoice {invoice.id.slice(0, 8).toUpperCase()}</p>
                          <p className="text-sm text-default-600">{invoice.vesselName} • Vessel ID: {invoice.vesselId}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Chip size="sm" color={meta.color}>{meta.label}</Chip>
                          <Chip size="sm" variant="soft">{invoice.paymentStatus}</Chip>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-4">
                        <div>
                          <p className="text-xs text-default-500">Total Amount</p>
                          <p className="font-medium">{toMoney(Number(invoice.totalAmount || 0), invoice.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500">Penalty</p>
                          <p className="font-medium">{toMoney(Number(invoice.penaltyAmount || 0), invoice.currency)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500">Due Date</p>
                          <p className="font-medium">{toDate(invoice.dueDate)}</p>
                        </div>
                        <div>
                          <p className="text-xs text-default-500">Created</p>
                          <p className="font-medium">{toDate(invoice.createdAt)}</p>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </Card.Content>
        </Card>

        <Card>
          <Card.Header>
            <Card.Title>Automated Billing Drafts</Card.Title>
            <Card.Description>
              Preview generated billing candidates for vessels that do not yet have invoices.
            </Card.Description>
          </Card.Header>
          <Card.Content className="space-y-3">
            {drafts.length === 0 ? (
              <div className="rounded-lg border border-divider p-4 text-sm text-default-500">
                Run Generate Draft Billing to produce invoice recommendations.
              </div>
            ) : (
              drafts.map((draft) => (
                <article key={draft.key} className="rounded-xl border border-divider bg-content2/40 p-4">
                  <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
                    <div>
                      <p className="font-semibold">{draft.vesselName}</p>
                      <p className="text-xs text-default-500">Vessel ID: {draft.vesselId}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Chip size="sm" color={draft.status === "ready" ? "success" : "warning"}>
                        {draft.status === "ready" ? "Ready" : "Needs Review"}
                      </Chip>
                      <Chip size="sm" variant="soft">{toMoney(draft.amount)}</Chip>
                    </div>
                  </div>

                  <p className="text-sm text-default-600">{draft.rule}</p>
                  <div className="mt-3 flex items-center gap-3">
                    <Progress value={draft.confidence} className="h-2" color="accent" />
                    <span className="text-xs font-medium">{draft.confidence}% confidence</span>
                  </div>
                </article>
              ))
            )}
          </Card.Content>
        </Card>
      </section>
    </DashboardLayout>
  );
}
