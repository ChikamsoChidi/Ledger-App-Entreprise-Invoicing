import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError, getToken } from "@/lib/api";

export const Route = createFileRoute("/invoices/")({
  head: () => ({ meta: [{ title: "Find invoice — Ledger" }] }),
  component: FindInvoice,
});

function FindInvoice() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const [id, setId] = useState("");
  const [error, setError] = useState<string | null>(null);

  const go = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!id.trim()) {
      setError("Enter an invoice ID");
      return;
    }
    navigate({ to: "/invoices/$id", params: { id: id.trim() } });
  };

  return (
    <AppShell eyebrow="// invoicing" title="Find invoice.">
      <form onSubmit={go} className="flex max-w-2xl flex-col gap-6">
        <label className="block">
          <span className="metro-eyebrow block">Invoice ID (UUID)</span>
          <input
            className="metro-input font-mono"
            value={id}
            onChange={(e) => setId(e.target.value)}
            placeholder="e.g. 5990dfc6-61c4-..."
          />
        </label>
        {error && (
          <div className="border-2 border-destructive p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <button className="metro-btn-accent self-start">Open</button>
      </form>
    </AppShell>
  );
}

// also expose a tiny helper for one-off lookups
export async function fetchInvoice(id: string) {
  return api<Record<string, unknown>>(`/api/v1/invoices/${id}`);
}
export { ApiError };
