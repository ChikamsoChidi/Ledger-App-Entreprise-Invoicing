import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError, getToken } from "@/lib/api";

export const Route = createFileRoute("/invoices/$id")({
  head: () => ({ meta: [{ title: "Invoice — Ledger" }] }),
  component: InvoiceDetail,
});

type Invoice = Record<string, unknown> & {
  id?: string;
  invoice_number?: string;
  status?: string;
  total_amount?: number;
  customer_name?: string;
  customer_email?: string;
  due_date?: string;
};

function InvoiceDetail() {
  const navigate = useNavigate();
  const { id } = Route.useParams();

  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const [invoice, setInvoice] = useState<Invoice | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await api<Invoice>(`/api/v1/invoices/${id}`);
      setInvoice(data);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load invoice");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const send = async () => {
    setSending(true);
    setNotice(null);
    setError(null);
    try {
      await api(`/api/v1/invoices/${id}/send`, { method: "POST" });
      setNotice("Invoice sent.");
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not send invoice");
    } finally {
      setSending(false);
    }
  };

  return (
    <AppShell eyebrow="// invoicing" title="Invoice.">
      {loading && <div className="metro-eyebrow text-cobalt">Loading…</div>}

      {error && (
        <div className="mb-6 border-2 border-destructive p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {invoice && (
        <div className="grid grid-cols-1 gap-0 border-2 border-ink md:grid-cols-2">
          <Cell label="Invoice #" value={String(invoice.invoice_number ?? "—")} mono />
          <Cell
            label="Status"
            value={String(invoice.status ?? "—").toUpperCase()}
            accent
          />
          <Cell label="Customer" value={String(invoice.customer_name ?? "—")} />
          <Cell label="Email" value={String(invoice.customer_email ?? "—")} />
          <Cell
            label="Due date"
            value={
              invoice.due_date
                ? new Date(invoice.due_date).toLocaleString()
                : "—"
            }
          />
          <Cell
            label="Total (kobo)"
            value={
              typeof invoice.total_amount === "number"
                ? invoice.total_amount.toLocaleString()
                : "—"
            }
            mono
          />
          <Cell label="ID" value={String(invoice.id ?? id)} mono full />
        </div>
      )}

      {invoice && (
        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            disabled={sending || String(invoice.status).toLowerCase() !== "draft"}
            onClick={send}
            className="metro-btn-accent"
          >
            {sending ? "Sending…" : "Mark as sent"}
          </button>
          <button onClick={load} className="metro-btn-ghost">
            Refresh
          </button>
          {notice && (
            <span className="metro-eyebrow text-cobalt">{notice}</span>
          )}
        </div>
      )}

      {invoice && (
        <details className="mt-10 border-2 border-ink p-4">
          <summary className="metro-eyebrow cursor-pointer">Raw payload</summary>
          <pre className="mt-3 overflow-auto text-xs">
            {JSON.stringify(invoice, null, 2)}
          </pre>
        </details>
      )}
    </AppShell>
  );
}

function Cell({
  label,
  value,
  mono,
  accent,
  full,
}: {
  label: string;
  value: string;
  mono?: boolean;
  accent?: boolean;
  full?: boolean;
}) {
  return (
    <div
      className={`border-b-2 border-r-2 border-ink p-6 last:border-r-0 ${
        accent ? "bg-cobalt text-white" : "bg-paper text-ink"
      } ${full ? "md:col-span-2" : ""}`}
    >
      <div className="metro-eyebrow opacity-80">{label}</div>
      <div className={`mt-2 text-xl ${mono ? "font-mono" : ""}`}>{value}</div>
    </div>
  );
}
