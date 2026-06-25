import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AppShell } from "@/components/AppShell";
import {
  DEFAULT_API_BASE_URL,
  getApiBaseUrl,
  getToken,
  setApiBaseUrl,
} from "@/lib/api";

export const Route = createFileRoute("/settings")({
  head: () => ({ meta: [{ title: "Settings — Ledger" }] }),
  component: Settings,
});

function Settings() {
  const navigate = useNavigate();
  useEffect(() => {
    if (!getToken()) navigate({ to: "/login" });
  }, [navigate]);

  const [value, setValue] = useState("");
  const [current, setCurrent] = useState("");
  const [saved, setSaved] = useState(false);
  const [pingMsg, setPingMsg] = useState<string | null>(null);

  useEffect(() => {
    const c = getApiBaseUrl();
    setCurrent(c);
    setValue(c);
  }, []);

  const save = (e: React.FormEvent) => {
    e.preventDefault();
    setApiBaseUrl(value);
    setCurrent(getApiBaseUrl());
    setSaved(true);
    setTimeout(() => setSaved(false), 1500);
  };

  const reset = () => {
    setApiBaseUrl("");
    const c = getApiBaseUrl();
    setCurrent(c);
    setValue(c);
  };

  const ping = async () => {
    setPingMsg("Pinging…");
    try {
      const res = await fetch(`${getApiBaseUrl()}/docs`, { method: "GET" });
      setPingMsg(
        res.ok
          ? `Reachable (HTTP ${res.status})`
          : `Reached server, status ${res.status}`,
      );
    } catch {
      setPingMsg("Unreachable — check the host and that the backend is running.");
    }
  };

  return (
    <AppShell eyebrow="// configuration" title="Backend host.">
      <p className="mb-10 max-w-2xl text-sm text-muted-foreground">
        Point the console at a different backend URL without rebuilding.
        Override is saved in this browser only. Clear it to fall back to the
        compile-time default (<span className="font-mono">{DEFAULT_API_BASE_URL}</span>).
      </p>

      <form onSubmit={save} className="flex max-w-3xl flex-col gap-6">
        <label className="block">
          <span className="metro-eyebrow block">API base URL</span>
          <input
            className="metro-input font-mono"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder="http://127.0.0.1:8000"
          />
        </label>

        <div className="border-2 border-ink p-4">
          <div className="metro-eyebrow">Currently using</div>
          <div className="mt-1 font-mono text-lg">{current}</div>
        </div>

        <div className="flex flex-wrap gap-3">
          <button type="submit" className="metro-btn-accent">Save</button>
          <button type="button" onClick={reset} className="metro-btn-ghost">
            Reset to default
          </button>
          <button type="button" onClick={ping} className="metro-btn">
            Test connection
          </button>
        </div>

        {saved && (
          <div className="metro-eyebrow text-cobalt">Saved.</div>
        )}
        {pingMsg && (
          <div className="border-2 border-ink p-3 text-sm">{pingMsg}</div>
        )}
      </form>
    </AppShell>
  );
}
