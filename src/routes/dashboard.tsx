import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { AppShell } from "@/components/AppShell";
import { getToken, getTenantId } from "@/lib/api";

export const Route = createFileRoute("/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard — Ledger" }] }),
  component: Dashboard,
});

function Dashboard() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const tenantId = getTenantId();

  return (
    <AppShell eyebrow="// console" title="Dashboard.">
      <div className="mb-12 max-w-3xl text-sm text-muted-foreground">
        Workspace ID: <span className="font-mono text-ink">{tenantId}</span>
      </div>

      <div className="grid grid-cols-1 gap-0 border-2 border-ink md:grid-cols-2">
        <ActionTile
          to="/invoices/new"
          n="01"
          title="Draft an invoice"
          body="Customer, line items, due date, WHT — done in seconds."
        />
        <ActionTile
          to="/ledger/new"
          n="02"
          title="Post a journal entry"
          body="Balanced double-entry. Refuses to commit if it doesn't balance."
          accent
        />
        <ActionTile
          to="/ledger/balance"
          n="03"
          title="Check a balance"
          body="Live computed account balance, straight from the ledger."
        />
        <ActionTile
          to="/invoices"
          n="04"
          title="Look up invoice"
          body="Pull any invoice by ID. Mark drafts as sent."
        />
      </div>
    </AppShell>
  );
}

function ActionTile({
  to,
  n,
  title,
  body,
  accent,
}: {
  to: string;
  n: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  const skin = accent ? "bg-cobalt text-white" : "bg-paper text-ink";
  return (
    <Link
      to={to}
      className={`group flex min-h-[220px] flex-col justify-between border-b-2 border-r-2 border-ink p-8 transition-transform last:border-r-0 hover:-translate-x-[2px] hover:-translate-y-[2px] ${skin}`}
    >
      <div className="metro-eyebrow opacity-80">{n}</div>
      <div>
        <h3 className="metro-heading text-3xl">{title}</h3>
        <p className="mt-3 text-sm opacity-90">{body}</p>
      </div>
    </Link>
  );
}
