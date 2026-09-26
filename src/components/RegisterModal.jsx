import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Diamond } from "./Ornaments";
import { api, fmtDate, fmtTime, fmtWhere, loadEvents, ROLE_LABEL, waLink } from "../lib/api";
import { AGE_RANGES, AREAS, GENDERS, SOURCES, STALL_CATEGORIES } from "../../backend/shared/options";
import { useUser } from "../lib/auth";
import { startCheckout } from "../lib/pay";
import { amountFor, METHODS, taka } from "../../backend/shared/payment";

/* openRegister({ event: slug, role, interest }) from anywhere on the page */
export const openRegister = (preset) =>
  window.dispatchEvent(new CustomEvent("open-register", { detail: preset || {} }));

/* ticket-office styling: cream paper, ink type, rust accents */
const field =
  "w-full bg-white/50 border-[1.5px] border-ink/25 rounded-[4px] px-[15px] py-[11px] font-body text-golden text-ink placeholder:text-ink/40 outline-none transition-colors focus:border-rust aria-[invalid=true]:border-rust [color-scheme:light]";
const label = "block font-label text-[12px] font-semibold tracking-[0.3em] uppercase text-rust mb-[6.5px]";
const errCls = "mt-[5px] font-label text-[12px] tracking-[0.12em] uppercase text-rust";
const chip = (active) =>
  `reg-chip text-left px-[15px] py-[10px] font-label text-[12px] font-medium tracking-[0.18em] uppercase border-[1.5px] transition-colors ${
    active ? "bg-ink text-mustard border-ink" : "bg-transparent text-ink/70 border-ink/30 hover:border-rust hover:text-rust"
  }`;
const PADX = "px-[clamp(20px,3vw,34px)]";
const EMPTY = { name: "", phone: "", email: "", business: "", guests: 1, age: "", gender: "", area: "", source: "", category: "", note: "" };

function Field({ id, title, error, children }) {
  return (
    <div>
      <label className={label} htmlFor={id}>{title}</label>
      {children}
      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}

function Pick({ id, value, onChange, options, placeholder, invalid }) {
  return (
    <select id={id} className={field} value={value} onChange={onChange} aria-invalid={invalid}>
      <option value="">{placeholder}</option>
      {options.map((o) => <option key={o} value={o}>{o}</option>)}
    </select>
  );
}

export default function RegisterModal() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState("event"); // event | interest
  const [events, setEvents] = useState([]);
  const [slug, setSlug] = useState("");
  const [role, setRole] = useState("");
  const [form, setForm] = useState(EMPTY);
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const [failure, setFailure] = useState("");
  const [ticket, setTicket] = useState(null); // { registration, duplicate } | { interest: true }
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");
  const cardRef = useRef(null);
  const backRef = useRef(null);
  const { user } = useUser();

  const event = events.find((e) => e.slug === slug) || null;
  const roles = event?.registration?.roles || ["visitor"];
  const pickRole = roles.length > 1;

  useEffect(() => {
    const onOpen = (e) => {
      const preset = e.detail || {};
      setErrors({});
      setFailure("");
      setTicket(null);
      setPayError("");
      // a signed-in guest never types what the account already knows
      setForm(user ? { ...EMPTY, name: user.name, phone: user.phone, email: user.email || "", business: user.business || "" } : EMPTY);
      setMode(preset.interest ? "interest" : "event");
      setOpen(true);
      loadEvents()
        .then((d) => {
          const ok = d.upcoming.filter((ev) => ev.registration?.open && !ev.over);
          setEvents(ok);
          if (!ok.length && !preset.interest) setMode("interest");
          const chosen = ok.find((ev) => ev.slug === preset.event) || ok[0];
          setSlug(chosen?.slug || "");
          const r = chosen?.registration?.roles || [];
          const wanted = preset.role || (user?.role === "stall" ? "stall" : "");
          setRole(r.includes(wanted) ? wanted : r.length === 1 ? r[0] : "");
        })
        .catch(() => setMode("interest"));
    };
    window.addEventListener("open-register", onOpen);
    return () => window.removeEventListener("open-register", onOpen);
  }, [user]);

  // switching events resets the role unless the new event has only one
  const chooseEvent = (s) => {
    setSlug(s);
    const r = events.find((e) => e.slug === s)?.registration?.roles || [];
    setRole(r.length === 1 ? r[0] : "");
    setErrors({});
  };

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      gsap.fromTo(backRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(
        cardRef.current,
        { y: 60, rotation: -1.5, scale: 0.94, opacity: 0 },
        { y: 0, rotation: 0, scale: 1, opacity: 1, duration: 0.6, ease: "expo.out", delay: 0.05 }
      );
    }
    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setFailure("");
    setErrors({});
    try {
      if (mode === "interest") {
        await api.post("/api/interest", { name: form.name, phone: form.phone, email: form.email, note: form.note });
        setTicket({ interest: true });
      } else {
        if (pickRole && !role) {
          setErrors({ role: "Visitor or vendor?" });
          return;
        }
        const body = { event: slug, role: role || roles[0], ...form, guests: Number(form.guests) || 1 };
        setTicket(await api.post("/api/registrations", body));
      }
    } catch (err) {
      if (err.details && Object.keys(err.details).length) setErrors(err.details);
      else setFailure(err.status ? err.message : "We couldn't reach the ticket office. Try again, or message us on WhatsApp.");
    } finally {
      setBusy(false);
    }
  }

  async function payNow(method) {
    setPayBusy(true);
    setPayError("");
    try {
      const { checkoutUrl } = await startCheckout(reg.id, method);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setPayError(err.message || "Couldn't open the counter — you can pay from My tickets.");
      setPayBusy(false);
    }
  }

  if (!open) return null;

  const reg = ticket?.registration;
  const due = reg ? amountFor(events.find((e) => e.slug === reg.event?.slug) || event, reg.role, reg.guests) : 0;
  const waText = reg
    ? `Hi Archer Events! I registered for ${reg.event.title} as ${ROLE_LABEL[reg.role]}. Ticket code: ${reg.code}.`
    : `Hi Archer Events! I'd like to register${event ? ` for ${event.title}` : ""}. ${form.name} (${form.phone})`;

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-[17px]" role="dialog" aria-modal="true" aria-label="Register">
      <div ref={backRef} className="absolute inset-0 bg-[rgba(27,24,21,0.78)] backdrop-blur-[10px]" onClick={() => setOpen(false)} />
      <form
        ref={cardRef}
        onSubmit={submit}
        noValidate
        className="relative w-[min(680px,100%)] max-h-[92svh] overflow-y-auto bg-cream3 text-ink rounded-[6px] border-[3px] border-rust shadow-[0_40px_90px_rgba(0,0,0,0.55)]"
      >
        <div className="pointer-events-none absolute inset-[5px] rounded-[3px] border border-rust/50" aria-hidden="true" />

        {/* stub */}
        <div className={`relative flex items-center justify-between gap-3 ${PADX} py-[12px] bg-rust text-cream rounded-t-[3px]`}>
          <span className="inline-flex items-center gap-3 font-label font-medium text-[12px] tracking-[0.34em] uppercase">
            <Diamond className="w-3 h-3 text-mustard" /> {reg ? "Your ticket" : mode === "interest" ? "First dibs" : "Registration"}
          </span>
          <button
            type="button"
            className="w-[34px] h-[34px] grid place-items-center rounded-full border-[1.5px] border-cream/60 text-cream bg-transparent transition-colors hover:bg-cream hover:text-rust"
            aria-label="Close"
            onClick={() => setOpen(false)}
          >
            &#x2715;
          </button>
        </div>
        <div className="perf" aria-hidden="true" />

        <div className={`relative ${PADX} pt-[24px] pb-[clamp(24px,3vw,34px)]`}>
          {ticket ? (
            /* ── confirmation ── */
            <div>
              <h3 className="h-display text-[clamp(27.5px,3.4vw,44.5px)] text-ink">{reg ? "You're in." : "You're on the list."}</h3>
              {reg ? (
                <>
                  <p className="mt-[6.5px] text-golden text-coffee">
                    {ticket.duplicate ? "You'd already registered with this number, so here's your existing ticket." : "Show this code at the gate. We'll message you before the day."}
                    {user ? (
                      <> It&rsquo;s saved under <a className="underline decoration-rust/60" href="/account">My tickets</a>.</>
                    ) : (
                      <> <a className="underline decoration-rust/60" href="/login?next=/account">Create an account</a> to keep your tickets in one place.</>
                    )}
                  </p>
                  <div className="mt-[20px] flex flex-wrap items-stretch gap-[14px]">
                    <div className="flex-1 min-w-[220px] bg-ink text-cream rounded-[4px] px-[20px] py-[16px]">
                      <span className="block font-label text-[11px] font-medium tracking-[0.34em] uppercase text-cream/55">Ticket code</span>
                      <span className="block font-display text-[clamp(27.5px,3.6vw,44.5px)] leading-none text-mustard tracking-[0.06em] mt-[6px]">{reg.code}</span>
                    </div>
                    <div className="flex-1 min-w-[220px] border-[1.5px] border-ink/25 rounded-[4px] px-[20px] py-[16px] font-label text-[13px] font-medium tracking-[0.14em] uppercase text-ink/75 leading-[1.8]">
                      <b className="text-ink">{reg.event.title}</b>
                      <br />
                      {fmtDate(reg.event.startsAt)} · {fmtTime(reg.event.startsAt)}
                      <br />
                      {fmtWhere(reg.event)}
                      <br />
                      {ROLE_LABEL[reg.role]}
                      {reg.role === "stall" && reg.business ? ` · ${reg.business}` : ""}
                      {reg.role === "visitor" && reg.guests > 1 ? ` · ${reg.guests} people` : ""}
                    </div>
                  </div>
                </>
              ) : (
                <p className="mt-[6.5px] text-golden text-coffee">We&rsquo;ll message you the moment the next event is announced.</p>
              )}
              {reg && due > 0 && (
                <div className="mt-[24px] pt-[20px] border-t border-line">
                  <span className="block font-label text-[12px] font-semibold tracking-[0.3em] uppercase text-rust mb-[6px]">
                    {taka(due)} to pay
                  </span>
                  <p className="text-golden text-coffee mb-[12px]">
                    {user ? "Pay now and your seat is confirmed on the spot." : "Sign in to pay, or settle it at the gate."}
                  </p>
                  {user ? (
                    <div className="flex flex-wrap items-center gap-[10px]">
                      {METHODS.map((m) => (
                        <button
                          key={m.id}
                          type="button"
                          className={`px-[15px] py-[10px] font-label text-[12px] font-medium tracking-[0.18em] uppercase border-[1.5px] border-ink/30 text-ink/75 transition-colors hover:border-rust hover:text-rust ${payBusy ? "opacity-50 pointer-events-none" : ""}`}
                          onClick={() => payNow(m.id)}
                        >
                          Pay with {m.name}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <a className="btn" href="/login?next=/account">Sign in to pay</a>
                  )}
                  {payError && <p className="mt-[10px] font-label text-[12px] tracking-[0.12em] uppercase text-rust">{payError}</p>}
                </div>
              )}

              <div className="mt-[24px] flex flex-wrap items-center gap-[14px]">
                {reg && (
                  <a className="btn ghost" href={waLink(waText)} target="_blank" rel="noreferrer">Save on WhatsApp &rarr;</a>
                )}
                <button type="button" className="btn ghost" onClick={() => setOpen(false)}>Done</button>
              </div>
            </div>
          ) : (
            /* ── form ── */
            <div>
              <h3 className="h-display text-[clamp(27.5px,3.4vw,44.5px)] text-ink">
                {mode === "interest" ? "Hear about it first." : "Save your spot."}
              </h3>
              <p className="mt-[6.5px] text-golden text-coffee">
                {mode === "interest"
                  ? "Nothing is on sale right now. Leave your number and you'll know before anyone else."
                  : "30 seconds. You get a ticket code straight away."}
              </p>

              {mode === "event" && (
                <div className="mt-[24px]">
                  <span className={label}>Event</span>
                  <div className="flex flex-wrap gap-[10.5px]">
                    {events.map((e) => (
                      <button key={e.slug} type="button" onClick={() => chooseEvent(e.slug)} className={chip(slug === e.slug)}>
                        {e.title} &middot; {fmtDate(e.startsAt)}
                        {e.pricing?.visitor || e.pricing?.stall ? (
                          <span className="block font-body normal-case tracking-normal text-[11.5px] text-ink/50">
                            from {taka(Math.min(...[e.pricing.visitor, e.pricing.stall].filter((n) => n > 0)))}
                          </span>
                        ) : (
                          <span className="block font-body normal-case tracking-normal text-[11.5px] text-ink/50">free entry</span>
                        )}
                      </button>
                    ))}
                  </div>
                  {errors.event && <p className={errCls}>{errors.event}</p>}
                </div>
              )}

              {mode === "event" && pickRole && (
                <div className="mt-[17px]">
                  <span className={label}>I&rsquo;m coming as</span>
                  <div className="flex flex-wrap gap-[10.5px]">
                    {roles.map((r) => (
                      <button key={r} type="button" onClick={() => { setRole(r); setErrors((x) => ({ ...x, role: "" })); }} className={chip(role === r)}>
                        {ROLE_LABEL[r]}
                      </button>
                    ))}
                  </div>
                  {role === "stall" && event?.registration?.stallInfo && (
                    <p className="mt-[10.5px] text-golden text-coffee">{event.registration.stallInfo}</p>
                  )}
                  {errors.role && <p className={errCls}>{errors.role}</p>}
                </div>
              )}

              <div className="mt-[17px] grid grid-cols-2 gap-[17px] max-[560px]:grid-cols-1">
                <Field id="reg-name" title="Your name" error={errors.name}>
                  <input id="reg-name" type="text" className={field} placeholder="Name" autoComplete="name" value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
                </Field>
                <Field id="reg-phone" title="Phone" error={errors.phone}>
                  <input id="reg-phone" type="tel" className={`${field} ${user ? "opacity-70" : ""}`} placeholder="01XXXXXXXXX" autoComplete="tel" value={form.phone} onChange={set("phone")} aria-invalid={!!errors.phone} readOnly={!!user} title={user ? "Your account's number" : undefined} />
                </Field>
                <Field id="reg-email" title="Email (optional)" error={errors.email}>
                  <input id="reg-email" type="email" className={field} placeholder="you@example.com" autoComplete="email" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
                </Field>
                {mode === "event" && (
                  <Field id="reg-age" title={role === "stall" ? "Age range (optional)" : "Age range"} error={errors.age}>
                    <Pick id="reg-age" value={form.age} onChange={set("age")} options={AGE_RANGES} placeholder="Pick one" invalid={!!errors.age} />
                  </Field>
                )}
                {mode === "event" && role === "stall" && (
                  <>
                    <Field id="reg-business" title="Store / brand" error={errors.business}>
                      <input id="reg-business" type="text" className={field} placeholder="Your shop's name" autoComplete="organization" value={form.business} onChange={set("business")} aria-invalid={!!errors.business} />
                    </Field>
                    <Field id="reg-category" title="What you sell" error={errors.category}>
                      <Pick id="reg-category" value={form.category} onChange={set("category")} options={STALL_CATEGORIES} placeholder="Pick a category" invalid={!!errors.category} />
                    </Field>
                  </>
                )}
                {mode === "event" && role !== "stall" && (
                  <>
                    <Field id="reg-guests" title="How many of you?" error={errors.guests}>
                      <select id="reg-guests" className={field} value={form.guests} onChange={set("guests")}>
                        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                          <option key={n} value={n}>{n === 1 ? "Just me" : `${n} people`}</option>
                        ))}
                      </select>
                    </Field>
                    <Field id="reg-area" title="Coming from (optional)" error={errors.area}>
                      <Pick id="reg-area" value={form.area} onChange={set("area")} options={AREAS} placeholder="Pick an area" />
                    </Field>
                  </>
                )}
                {mode === "event" && (
                  <>
                    <Field id="reg-gender" title="Gender (optional)" error={errors.gender}>
                      <Pick id="reg-gender" value={form.gender} onChange={set("gender")} options={GENDERS} placeholder="Rather not say" />
                    </Field>
                    <Field id="reg-source" title="How did you hear about it?" error={errors.source}>
                      <Pick id="reg-source" value={form.source} onChange={set("source")} options={SOURCES} placeholder="Pick one" />
                    </Field>
                  </>
                )}
              </div>

              <div className="mt-[17px]">
                <Field id="reg-note" title="Anything else?" error={errors.note}>
                  <textarea id="reg-note" rows={2} className={`${field} resize-none`} placeholder={role === "stall" ? "What you sell, power or space needs..." : "Questions, requests..."} value={form.note} onChange={set("note")} />
                </Field>
              </div>

              {failure && (
                <p className="mt-[17px] px-[15px] py-[11px] border-[1.5px] border-rust/50 bg-rust/10 font-label text-[12.5px] tracking-[0.12em] uppercase text-rust">
                  {failure} <a className="underline" href={waLink(waText)} target="_blank" rel="noreferrer">Open WhatsApp</a>
                </p>
              )}

              <div className="mt-[24px] flex flex-wrap items-center gap-[14px]">
                <button type="submit" className={`btn ${busy ? "opacity-60 pointer-events-none" : ""}`} disabled={busy}>
                  {busy ? "Sending" : mode === "interest" ? "Keep me posted" : "Get my ticket"} &rarr;
                </button>
                <a className="btn ghost" href={waLink(waText)} target="_blank" rel="noreferrer">WhatsApp instead</a>
              </div>
            </div>
          )}
        </div>
      </form>
    </div>
  );
}
