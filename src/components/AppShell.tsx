import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { clearAuth, getToken } from "@/lib/api";

const NAV = [
  { to: "/dashboard", label: "Dashboard" },
  { to: "/invoices/new", label: "New Invoice" },
  { to: "/invoices", label: "Find Invoice" },
  { to: "/ledger/new", label: "Journal Entry" },
  { to: "/ledger/balance", label: "Balances" },
] as const;

export function AppShell({
  eyebrow,
  title,
  children,
}: {
  eyebrow?: string;
  title: string;
  children: ReactNode;
}) {
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const authed = typeof window !== "undefined" && !!getToken();

  return (
    <div className="min-h-screen bg-paper text-ink">
      {/* Top bar */}
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <Link to="/" className="flex items-baseline gap-3">
            <span className="text-2xl font-extrabold tracking-tight">LEDGER</span>
            <span className="metro-eyebrow text-cobalt">// enterprise</span>
          </Link>
          <div className="flex items-center gap-3">
            {authed ? (
              <button
                className="metro-btn-ghost"
                onClick={() => {
                  clearAuth();
                  navigate({ to: "/login" });
                }}
              >
                Sign out
              </button>
            ) : (
              <>
                <Link to="/login" className="metro-btn-ghost">
                  Sign in
                </Link>
                <Link to="/signup" className="metro-btn-accent">
                  Create workspace
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-12 gap-0">
        {/* Side rail */}
        {authed && (
          <aside className="col-span-12 border-b-2 border-ink md:col-span-3 md:border-b-0 md:border-r-2">
            <nav className="flex flex-row flex-wrap gap-0 md:flex-col">
              {NAV.map((item) => {
                const active = pathname === item.to;
                return (
                  <Link
                    key={item.to}
                    to={item.to}
                    className={`block border-b-2 border-ink px-6 py-4 text-sm font-semibold uppercase tracking-wider transition-colors ${
                      active
                        ? "bg-ink text-paper"
                        : "hover:bg-cobalt hover:text-white"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>
        )}

        <main className={authed ? "col-span-12 md:col-span-9" : "col-span-12"}>
          <div className="px-6 py-10 md:px-12 md:py-14">
            {eyebrow && (
              <div className="metro-eyebrow mb-3 text-cobalt">{eyebrow}</div>
            )}
            <h1 className="metro-heading mb-10 text-5xl md:text-7xl">{title}</h1>
            {children}
          </div>
        </main>
      </div>

      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center justify-between gap-2 px-6 py-4 text-xs">
          <span className="metro-eyebrow">Ledger / Enterprise console</span>
          <span className="metro-eyebrow text-cobalt">v1.0</span>
        </div>
      </footer>
    </div>
  );
}
