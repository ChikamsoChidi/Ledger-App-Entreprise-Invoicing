import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError, getToken } from "@/lib/api";

export const Route = createFileRoute("/invoices/new")({
  head: () => ({ meta: [{ title: "New invoice — Ledger" }] }),
  component: NewInvoice,
});

type Item = { description: string; quantity: number; unit_price: number };
type DraftResp = {
  message: string;
  invoice_id: string;
  invoice_number: string;
  status: string;
  total_amount: number;
};

function NewInvoice() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [dueDate, setDueDate] = useState("");
  const [whtRate, setWhtRate] = useState(0);
  const [items, setItems] = useState<Item[]>([
    { description: "", quantity: 1, unit_price: 0 },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<DraftResp | null>(null);

  const subtotal = items.reduce((s, i) => s + i.quantity * i.unit_price, 0);

  const updateItem = (idx: number, patch: Partial<Item>) =>
    setItems((prev) => prev.map((it, i) => (i === idx ? { ...it, ...patch } : it)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setBusy(true);
    try {
      const payload = {
        customer_name: customerName,
        customer_email: customerEmail,
        due_date: new Date(dueDate).toISOString(),
        wht_rate_percentage: whtRate,
        items: items.map((i) => ({
          description: i.description,
          quantity: Number(i.quantity),
          unit_price: Number(i.unit_price),
        })),
      };
      const res = await api<DraftResp>("/api/v1/invoices/draft", {
        method: "POST",
        body: JSON.stringify(payload),
      });
      setResult(res);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not create invoice");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell eyebrow="// invoicing" title="New invoice.">
      <form onSubmit={submit} className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-8">
          <Field label="Customer name">
            <input
              required
              minLength={2}
              className="metro-input"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
            />
          </Field>
          <Field label="Customer email">
            <input
              type="email"
              required
              className="metro-input"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
            />
          </Field>
          <Field label="Due date">
            <input
              type="datetime-local"
              required
              className="metro-input"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </Field>
          <Field label="Withholding tax %  (0–10)">
            <input
              type="number"
              min={0}
              max={10}
              className="metro-input"
              value={whtRate}
              onChange={(e) => setWhtRate(Number(e.target.value))}
            />
          </Field>
        </div>

        <div className="flex flex-col gap-4">
          <div className="metro-eyebrow text-cobalt">Line items (amounts in kobo)</div>

          {items.map((it, idx) => (
            <div
              key={idx}
              className="grid grid-cols-12 gap-3 border-2 border-ink p-4"
            >
              <div className="col-span-12">
                <span className="metro-eyebrow">Description</span>
                <input
                  required
                  minLength={3}
                  className="metro-input"
                  value={it.description}
                  onChange={(e) => updateItem(idx, { description: e.target.value })}
                />
              </div>
              <div className="col-span-4">
                <span className="metro-eyebrow">Qty</span>
                <input
                  type="number"
                  min={1}
                  className="metro-input"
                  value={it.quantity}
                  onChange={(e) =>
                    updateItem(idx, { quantity: Number(e.target.value) })
                  }
                />
              </div>
              <div className="col-span-6">
                <span className="metro-eyebrow">Unit price (kobo)</span>
                <input
                  type="number"
                  min={1}
                  className="metro-input"
                  value={it.unit_price}
                  onChange={(e) =>
                    updateItem(idx, { unit_price: Number(e.target.value) })
                  }
                />
              </div>
              <div className="col-span-2 flex items-end justify-end">
                {items.length > 1 && (
                  <button
                    type="button"
                    className="metro-btn-ghost h-fit !px-3 !py-2 text-xs"
                    onClick={() =>
                      setItems((prev) => prev.filter((_, i) => i !== idx))
                    }
                  >
                    ×
                  </button>
                )}
              </div>
            </div>
          ))}

          <button
            type="button"
            className="metro-btn-ghost self-start"
            onClick={() =>
              setItems((p) => [...p, { description: "", quantity: 1, unit_price: 0 }])
            }
          >
            + Add line item
          </button>

          <div className="mt-4 border-t-2 border-ink pt-4">
            <div className="flex justify-between">
              <span className="metro-eyebrow">Subtotal</span>
              <span className="font-mono">{subtotal.toLocaleString()} kobo</span>
            </div>
          </div>

          {error && (
            <div className="border-2 border-destructive p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {result && (
            <div className="border-2 border-cobalt bg-cobalt p-4 text-white">
              <div className="metro-eyebrow opacity-80">Draft created</div>
              <div className="mt-1 font-mono text-sm">
                {result.invoice_number}
              </div>
              <div className="mt-1 text-xs">
                Status: {result.status} · Total: {result.total_amount}
              </div>
              <button
                type="button"
                onClick={() =>
                  navigate({ to: "/invoices/$id", params: { id: result.invoice_id } })
                }
                className="mt-3 inline-flex items-center justify-center border-2 border-white px-3 py-1 text-xs font-semibold uppercase tracking-wider hover:bg-white hover:text-cobalt"
              >
                Open invoice →
              </button>
            </div>
          )}

          <button
            type="submit"
            disabled={busy}
            className="metro-btn-accent self-start"
          >
            {busy ? "Creating…" : "Create draft"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="metro-eyebrow block">{label}</span>
      {children}
    </label>
  );
}
