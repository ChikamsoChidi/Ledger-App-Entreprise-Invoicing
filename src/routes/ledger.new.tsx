import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError, getToken } from "@/lib/api";

export const Route = createFileRoute("/ledger/new")({
  head: () => ({ meta: [{ title: "Journal entry — Ledger" }] }),
  component: NewJournal,
});

type Line = { account_id: string; amount: number; entry_type: "DEBIT" | "CREDIT" };

function NewJournal() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const [referenceId, setReferenceId] = useState("");
  const [description, setDescription] = useState("");
  const [lines, setLines] = useState<Line[]>([
    { account_id: "", amount: 0, entry_type: "DEBIT" },
    { account_id: "", amount: 0, entry_type: "CREDIT" },
  ]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const debits = lines.filter((l) => l.entry_type === "DEBIT").reduce((s, l) => s + Number(l.amount), 0);
  const credits = lines.filter((l) => l.entry_type === "CREDIT").reduce((s, l) => s + Number(l.amount), 0);
  const balanced = debits === credits && debits > 0;

  const update = (i: number, p: Partial<Line>) =>
    setLines((prev) => prev.map((l, idx) => (idx === i ? { ...l, ...p } : l)));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusy(true);
    try {
      const res = await api<{ message: string; journal_entry_id: string }>(
        "/api/v1/ledger/journal-entries",
        {
          method: "POST",
          body: JSON.stringify({
            reference_id: referenceId,
            description,
            lines: lines.map((l) => ({
              account_id: l.account_id,
              amount: Number(l.amount),
              entry_type: l.entry_type,
            })),
          }),
        },
      );
      setSuccess(`${res.message} (${res.journal_entry_id})`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Posting failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell eyebrow="// ledger" title="Journal entry.">
      <form onSubmit={submit} className="grid grid-cols-1 gap-10 md:grid-cols-2">
        <div className="flex flex-col gap-8">
          <label className="block">
            <span className="metro-eyebrow block">Reference ID</span>
            <input
              required
              className="metro-input font-mono"
              value={referenceId}
              onChange={(e) => setReferenceId(e.target.value)}
              placeholder="e.g. PSK_REF_8821"
            />
          </label>
          <label className="block">
            <span className="metro-eyebrow block">Description</span>
            <input
              required
              minLength={3}
              className="metro-input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </label>

          <div className="grid grid-cols-2 gap-0 border-2 border-ink">
            <div className="border-r-2 border-ink bg-paper p-4">
              <div className="metro-eyebrow">Debits</div>
              <div className="mt-1 font-mono text-2xl">{debits.toLocaleString()}</div>
            </div>
            <div className={`p-4 ${balanced ? "bg-cobalt text-white" : "bg-paper text-ink"}`}>
              <div className="metro-eyebrow opacity-80">Credits</div>
              <div className="mt-1 font-mono text-2xl">{credits.toLocaleString()}</div>
            </div>
          </div>

          <div className={`metro-eyebrow ${balanced ? "text-cobalt" : "text-destructive"}`}>
            {balanced ? "✓ Balanced" : "Not balanced — debits must equal credits"}
          </div>
        </div>

        <div className="flex flex-col gap-3">
          <div className="metro-eyebrow text-cobalt">Lines (kobo)</div>

          {lines.map((l, idx) => (
            <div key={idx} className="grid grid-cols-12 gap-3 border-2 border-ink p-4">
              <div className="col-span-12">
                <span className="metro-eyebrow">Account ID (UUID)</span>
                <input
                  required
                  className="metro-input font-mono"
                  value={l.account_id}
                  onChange={(e) => update(idx, { account_id: e.target.value })}
                />
              </div>
              <div className="col-span-5">
                <span className="metro-eyebrow">Amount</span>
                <input
                  type="number"
                  min={1}
                  className="metro-input"
                  value={l.amount}
                  onChange={(e) => update(idx, { amount: Number(e.target.value) })}
                />
              </div>
              <div className="col-span-5">
                <span className="metro-eyebrow">Type</span>
                <select
                  className="metro-input bg-paper"
                  value={l.entry_type}
                  onChange={(e) =>
                    update(idx, { entry_type: e.target.value as "DEBIT" | "CREDIT" })
                  }
                >
                  <option value="DEBIT">DEBIT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>
              </div>
              <div className="col-span-2 flex items-end justify-end">
                {lines.length > 2 && (
                  <button
                    type="button"
                    className="metro-btn-ghost h-fit !px-3 !py-2 text-xs"
                    onClick={() => setLines((p) => p.filter((_, i) => i !== idx))}
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
              setLines((p) => [...p, { account_id: "", amount: 0, entry_type: "DEBIT" }])
            }
          >
            + Add line
          </button>

          {error && (
            <div className="border-2 border-destructive p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          {success && (
            <div className="border-2 border-cobalt bg-cobalt p-3 text-sm text-white">
              {success}
            </div>
          )}

          <button
            type="submit"
            disabled={busy || !balanced}
            className="metro-btn-accent self-start"
          >
            {busy ? "Posting…" : "Post entry"}
          </button>
        </div>
      </form>
    </AppShell>
  );
}
