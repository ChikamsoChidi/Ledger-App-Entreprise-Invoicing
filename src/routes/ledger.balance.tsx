import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import { api, ApiError, getToken } from "@/lib/api";

export const Route = createFileRoute("/ledger/balance")({
  head: () => ({ meta: [{ title: "Balances — Ledger" }] }),
  component: BalancePage,
});

function BalancePage() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const [accountId, setAccountId] = useState("");
  const [balance, setBalance] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const lookup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBalance(null);
    setBusy(true);
    try {
      const res = await api<{ account_id: string; balance: number }>(
        `/api/v1/ledger/accounts/${accountId}/balance`,
      );
      setBalance(res.balance);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Lookup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppShell eyebrow="// ledger" title="Account balance.">
      <form onSubmit={lookup} className="flex max-w-2xl flex-col gap-6">
        <label className="block">
          <span className="metro-eyebrow block">Account ID (UUID)</span>
          <input
            required
            className="metro-input font-mono"
            value={accountId}
            onChange={(e) => setAccountId(e.target.value)}
          />
        </label>
        {error && (
          <div className="border-2 border-destructive p-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <button disabled={busy} className="metro-btn-accent self-start">
          {busy ? "Computing…" : "Get balance"}
        </button>
      </form>

      {balance !== null && (
        <div className="mt-10 inline-block border-2 border-ink bg-cobalt p-10 text-white">
          <div className="metro-eyebrow opacity-80">Balance (kobo)</div>
          <div className="mt-2 font-mono text-6xl">{balance.toLocaleString()}</div>
        </div>
      )}
    </AppShell>
  );
}
