import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api, setAuth, ApiError } from "@/lib/api";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Sign in — Ledger" }] }),
  component: Login,
});

type LoginResp = {
  access_token: string;
  token_type: string;
  user_id: string;
  tenant_id: string;
};

function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api<LoginResp>("/api/v1/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      setAuth(res.access_token, res.tenant_id, res.user_id);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Sign in failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r-2 border-ink bg-ink p-12 text-paper md:flex">
        <div className="metro-eyebrow text-cobalt">// access</div>
        <h1 className="metro-heading text-7xl">
          Welcome
          <br />
          <span className="text-cobalt">back.</span>
        </h1>
        <p className="metro-eyebrow opacity-60">Ledger / Enterprise</p>
      </div>
      <div className="flex flex-col justify-center px-8 py-16 md:px-20">
        <div className="metro-eyebrow mb-2 text-cobalt">Sign in</div>
        <h2 className="metro-heading mb-10 text-5xl">Continue.</h2>

        <form onSubmit={submit} className="flex flex-col gap-8">
          <Field label="Email">
            <input
              type="email"
              required
              className="metro-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@company.com"
            />
          </Field>
          <Field label="Password">
            <input
              type="password"
              required
              className="metro-input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
          </Field>

          {error && (
            <div className="border-2 border-destructive p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="flex items-center gap-4">
            <button type="submit" disabled={busy} className="metro-btn-accent">
              {busy ? "Signing in…" : "Sign in"}
            </button>
            <Link to="/signup" className="metro-eyebrow underline">
              New here? Create a workspace
            </Link>
          </div>
        </form>
      </div>
    </div>
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
