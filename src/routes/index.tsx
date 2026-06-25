import { createFileRoute, Link } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ledger — Enterprise Operations" },
      {
        name: "description",
        content:
          "A dichromatic operations console for SMEs: invoicing, ledger, and payments.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-paper text-ink">
      <header className="border-b-2 border-ink">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-5">
          <div className="flex items-baseline gap-3">
            <span className="text-2xl font-extrabold tracking-tight">LEDGER</span>
            <span className="metro-eyebrow text-cobalt">// enterprise</span>
          </div>
          <div className="flex gap-3">
            <Link to="/login" className="metro-btn-ghost">Sign in</Link>
            <Link to="/signup" className="metro-btn-accent">Create workspace</Link>
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1400px] px-6 py-20 md:py-32">
        <div className="metro-eyebrow mb-6 text-cobalt">01 / Operations OS</div>
        <h1 className="metro-heading max-w-5xl text-6xl md:text-[8rem]">
          Run the books.
          <br />
          <span className="text-cobalt">Send the invoice.</span>
          <br />
          Get paid.
        </h1>
        <p className="mt-10 max-w-2xl text-lg leading-relaxed text-muted-foreground">
          A no-nonsense back-office console for SMEs. Issue invoices, post
          balanced journal entries, and reconcile Paystack collections — all
          from one flat, fast, dichromatic surface.
        </p>
        <div className="mt-10 flex flex-wrap gap-3">
          <Link to="/signup" className="metro-btn-accent">Start free</Link>
          <Link to="/login" className="metro-btn">I already have a workspace</Link>
        </div>
      </section>

      <section className="border-t-2 border-ink">
        <div className="mx-auto grid max-w-[1400px] grid-cols-1 md:grid-cols-3">
          <Tile n="02" title="Invoicing" body="Draft, send, and chase invoices with built-in WHT handling. Amounts in kobo, precision by default." />
          <Tile n="03" title="Ledger" body="Post double-entry journal entries. Live balances per account. Unbalanced entries refuse to commit." accent />
          <Tile n="04" title="Payments" body="Paystack webhook verification baked in. Charge success auto-marks the matching invoice as paid." />
        </div>
      </section>

      <footer className="border-t-2 border-ink">
        <div className="mx-auto flex max-w-[1400px] items-center justify-between px-6 py-4">
          <span className="metro-eyebrow">Ledger / Enterprise</span>
          <span className="metro-eyebrow text-cobalt">v1.0</span>
        </div>
      </footer>
    </div>
  );
}

function Tile({
  n,
  title,
  body,
  accent,
}: {
  n: string;
  title: string;
  body: string;
  accent?: boolean;
}) {
  const base =
    "border-r-2 border-b-2 border-ink p-10 md:p-12 last:border-r-0 min-h-[280px] flex flex-col justify-between";
  const skin = accent ? "bg-cobalt text-white" : "bg-paper text-ink";
  return (
    <div className={`${base} ${skin}`}>
      <div className="metro-eyebrow opacity-80">{n}</div>
      <div>
        <h3 className="metro-heading text-4xl md:text-5xl">{title}</h3>
        <p className="mt-4 text-sm leading-relaxed opacity-90">{body}</p>
      </div>
    </div>
  );
}
