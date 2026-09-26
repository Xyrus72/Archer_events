import { useEffect, useState } from "react";
import { Crest } from "../components/Logo";
import { Diamond } from "../components/Ornaments";
import { api, waLink } from "../lib/api";
import { getUser, login, register, safeNext } from "../lib/auth";
import PasswordInput from "../components/PasswordInput";

/* while the demo data is loaded, one tap is enough to look around as anyone */
const DEMO = [
  ["Visitor", "01711111111", "archer123"],
  ["Stall vendor", "01722222222", "archer123"],
];
const DEMO_STAFF = ["Staff", "01700000000", "admin123"];

/* Saved logins for local testing: VITE_SAVED_LOGINS in .env.local (gitignored), as
   [["Visitor","017…","password"], …]. Dev server only — never shipped in a production build. */
const SAVED = (() => {
  if (!import.meta.env.DEV) return [];
  try {
    const list = JSON.parse(import.meta.env.VITE_SAVED_LOGINS || "[]");
    return Array.isArray(list) ? list.filter((r) => Array.isArray(r) && r.length === 3) : [];
  } catch {
    return [];
  }
})();

/* The ticket window: same paper, rules and type as the register modal,
   because signing in is the same act as picking up a ticket. */

const field =
  "w-full bg-white/50 border-[1.5px] border-ink/25 rounded-[4px] px-[15px] py-[11px] font-body text-golden text-ink placeholder:text-ink/40 outline-none transition-colors focus:border-rust aria-[invalid=true]:border-rust [color-scheme:light]";
const label = "block font-label text-[12px] font-semibold tracking-[0.3em] uppercase text-rust mb-[6.5px]";
const errCls = "mt-[5px] font-label text-[12px] tracking-[0.12em] uppercase text-rust";
const chip = (active) =>
  `px-[15px] py-[10px] font-label text-[12px] font-medium tracking-[0.18em] uppercase border-[1.5px] transition-colors ${
    active ? "bg-ink text-mustard border-ink" : "bg-transparent text-ink/70 border-ink/30 hover:border-rust hover:text-rust"
  }`;
const PADX = "px-[clamp(20px,4vw,38px)]";
const EMPTY = { name: "", phone: "", email: "", business: "", password: "" };

function Field({ id, title, error, children }) {
  return (
    <div>
      <label className={label} htmlFor={id}>{title}</label>
      {children}
      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}

export default function Login() {
  const [mode, setMode] = useState("in"); // in | up
  const [role, setRole] = useState("visitor");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [failure, setFailure] = useState("");
  const [busy, setBusy] = useState(false);
  const [demo, setDemo] = useState(null); // { on, staff } once /api/health answers

  const land = (user) => {
    const next = new URLSearchParams(window.location.search).get("next");
    window.location.assign(user.role === "admin" ? "/admin" : safeNext(next));
  };

  useEffect(() => {
    document.title = "Sign in — Archer Events";
    let on = true;
    // already signed in: straight through to where they were going
    getUser().then((u) => u && land(u));
    api.get("/api/health").then((h) => on && setDemo({ on: !!h.demo, staff: !!h.demoStaff })).catch(() => {});
    return () => {
      on = false;
    };
  }, []);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const swap = (m) => {
    setMode(m);
    setErrors({});
    setFailure("");
  };

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    setFailure("");
    try {
      const user =
        mode === "in"
          ? await login({ phone: form.phone, password: form.password })
          : await register({ role, name: form.name, phone: form.phone, email: form.email, business: form.business, password: form.password });
      land(user);
    } catch (err) {
      if (err.details && Object.keys(err.details).length) setErrors(err.details);
      else setFailure(err.status ? err.message : "We couldn't reach the ticket office. Try again in a moment.");
      setBusy(false);
    }
  }

  async function quick(phone, password) {
    setBusy(true);
    setFailure("");
    try {
      land(await login({ phone, password }));
    } catch (err) {
      setFailure(err.message || "That demo account is not there any more.");
      setBusy(false);
    }
  }

  // fills the box with a saved login; pressing Sign in does the rest
  function fill(phone, password) {
    swap("in");
    setForm((f) => ({ ...f, phone, password }));
  }

  const up = mode === "up";

  return (
    <main className="relative min-h-svh flex flex-col items-center justify-center px-[6vw] py-[16vh] overflow-hidden">
      <div className="sunburst opacity-60" aria-hidden="true" />

      <a href="/" className="relative" aria-label="Archer Events, home">
        <Crest className="w-[clamp(180px,26vw,260px)] h-auto" />
      </a>

      <form
        onSubmit={submit}
        noValidate
        className="relative w-[min(560px,100%)] mt-[34px] bg-cream3 text-ink rounded-[6px] border-[3px] border-rust shadow-[0_30px_60px_rgba(27,24,21,0.18)]"
      >
        <div className="pointer-events-none absolute inset-[5px] rounded-[3px] border border-rust/50" aria-hidden="true" />

        <div className={`relative flex items-center justify-between gap-3 ${PADX} py-[12px] bg-rust text-cream rounded-t-[3px]`}>
          <span className="inline-flex items-center gap-3 font-label font-medium text-[12px] tracking-[0.34em] uppercase">
            <Diamond className="w-3 h-3 text-mustard" /> Ticket window
          </span>
        </div>
        <div className="perf" aria-hidden="true" />

        <div className={`relative ${PADX} pt-[24px] pb-[clamp(24px,3vw,34px)]`}>
          {!SAVED.length && demo?.on && (
            <div className="mb-[22px] pb-[20px] border-b border-line">
              <span className={label}>Have a look around — no password needed</span>
              <div className="flex flex-wrap gap-[10.5px]">
                {[...DEMO, ...(demo.staff ? [DEMO_STAFF] : [])].map(([who, phone, password]) => (
                  <button
                    key={who}
                    type="button"
                    className={`btn ghost px-[16px] py-[10px] text-[11px] ${busy ? "opacity-50 pointer-events-none" : ""}`}
                    onClick={() => quick(phone, password)}
                  >
                    Enter as {who}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-[10.5px]">
            <button type="button" className={chip(!up)} onClick={() => swap("in")}>Sign in</button>
            <button type="button" className={chip(up)} onClick={() => swap("up")}>Create account</button>
          </div>

          <h1 className="h-display text-[clamp(27.5px,3.4vw,44.5px)] text-ink mt-[20px]">
            {up ? "Join the guest list." : "Welcome back."}
          </h1>
          <p className="mt-[6.5px] text-golden text-coffee">
            {up
              ? "One account keeps every ticket and stall booking in one place."
              : "Your tickets, your stalls, and everything you have registered for."}
          </p>

          {!up && SAVED.length > 0 && (
            <div className="mt-[20px]">
              <span className={label}>Sign in as</span>
              <div className="flex flex-wrap gap-[10.5px]">
                {SAVED.map(([who, phone, password]) => (
                  <button
                    key={who}
                    type="button"
                    className={`btn ghost px-[16px] py-[10px] text-[11px] ${form.phone === phone && form.password === password ? "bg-ink! text-mustard!" : ""}`}
                    onClick={() => fill(phone, password)}
                  >
                    {who}
                  </button>
                ))}
              </div>
            </div>
          )}

          {up && (
            <div className="mt-[24px]">
              <span className={label}>I am a</span>
              <div className="flex flex-wrap gap-[10.5px]">
                {[["visitor", "Visitor"], ["stall", "Stall vendor"]].map(([v, t]) => (
                  <button key={v} type="button" className={chip(role === v)} onClick={() => setRole(v)}>{t}</button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-[17px] grid grid-cols-2 gap-[17px] max-[560px]:grid-cols-1">
            {up && (
              <Field id="lg-name" title="Your name" error={errors.name}>
                <input id="lg-name" type="text" className={field} placeholder="Name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
              </Field>
            )}
            <Field id="lg-phone" title="Phone" error={errors.phone}>
              <input id="lg-phone" type="tel" className={field} placeholder="01XXXXXXXXX" autoComplete="tel" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} />
            </Field>
            <Field id="lg-password" title={up ? "Password (8+ characters)" : "Password"} error={errors.password}>
              <PasswordInput id="lg-password" className={field} placeholder="••••••••" autoComplete={up ? "new-password" : "current-password"} value={form.password} onChange={set("password")} aria-invalid={!!errors.password} />
            </Field>
            {up && (
              <Field id="lg-email" title="Email (optional)" error={errors.email}>
                <input id="lg-email" type="email" className={field} placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
              </Field>
            )}
            {up && role === "stall" && (
              <Field id="lg-business" title="Store / brand" error={errors.business}>
                <input id="lg-business" type="text" className={field} placeholder="Your shop's name" autoComplete="organization" value={form.business} onChange={set("business")} aria-invalid={!!errors.business} />
              </Field>
            )}
          </div>

          {failure && (
            <p className="mt-[17px] px-[15px] py-[11px] border-[1.5px] border-rust/50 bg-rust/10 font-label text-[12.5px] tracking-[0.12em] uppercase text-rust">
              {failure}
            </p>
          )}

          <div className="mt-[24px] flex flex-wrap items-center gap-[14px]">
            <button type="submit" className={`btn ${busy ? "opacity-60 pointer-events-none" : ""}`} disabled={busy}>
              {busy ? "One moment" : up ? "Create account" : "Sign in"} &rarr;
            </button>
            <a className="btn ghost" href={waLink("Hi Archer Events! I need help with my account.")} target="_blank" rel="noreferrer">
              Forgot? Message us
            </a>
          </div>
        </div>
      </form>
    </main>
  );
}
