import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { api, setAuth, ApiError } from "@/lib/api";

export const Route = createFileRoute("/signup")({
  head: () => ({ meta: [{ title: "Create workspace — Ledger" }] }),
  component: Signup,
});

type SignupResp = {
  user_id: string;
  tenant_id: string;
  message: string;
  access_token: string;
};

function Signup() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const res = await api<SignupResp>("/api/v1/auth/signup", {
        method: "POST",
        body: JSON.stringify({
          email,
          password,
          company_name: companyName,
        }),
      });
      setAuth(res.access_token, res.tenant_id, res.user_id);
      navigate({ to: "/dashboard" });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Signup failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="grid min-h-screen grid-cols-1 md:grid-cols-2">
      <div className="hidden flex-col justify-between border-r-2 border-ink bg-cobalt p-12 text-white md:flex">
        <div className="metro-eyebrow opacity-80">// new workspace</div>
        <h1 className="metro-heading text-7xl">
          Open
          <br />
          the books.
        </h1>
        <p className="metro-eyebrow opacity-80">One workspace per company.</p>
      </div>
      <div className="flex flex-col justify-center px-8 py-16 md:px-20">
        <div className="metro-eyebrow mb-2 text-cobalt">Create</div>
        <h2 className="metro-heading mb-10 text-5xl">Get started.</h2>

        <form onSubmit={submit} className="flex flex-col gap-8">
          <Field label="Company name">
            <input
              required
              minLength={2}
              className="metro-input"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Acme Holdings Ltd."
            />
          </Field>
          <Field label="Email">
            <input
              type="email"
              required
              className="metro-input"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="founder@acme.com"
            />
          </Field>
          <Field label="Password (min 8 chars)">
            <input
              type="password"
              required
              minLength={8}
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
              {busy ? "Creating…" : "Create workspace"}
            </button>
            <Link to="/login" className="metro-eyebrow underline">
              Already have one? Sign in
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
