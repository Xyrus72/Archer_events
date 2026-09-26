import { useEffect, useState } from "react";
import { Diamond } from "../components/Ornaments";
import { openRegister } from "../components/RegisterModal";
import { fmtDate, fmtTime, fmtWhere, useEvents } from "../lib/api";
import { cancelTicket, firstName, logout, myRegistrations, ROLE_NAME, useUser } from "../lib/auth";
import { taka } from "../../backend/shared/payment";
import Ticket from "./AccountTicket";
import Profile from "./AccountProfile";

/* A guest's own counter: what they hold, what they owe, what is next, who they are.
   It runs the full width of the page — this is a desk, not a card. */

const PADX = "px-[clamp(20px,3vw,40px)]";
const stub = "font-label font-medium text-[13px] tracking-[0.34em] uppercase";

export function Section({ title, aside, children }) {
  return (
    <section className="relative bg-cream3 text-ink rounded-[6px] border-[3px] border-rust shadow-[0_24px_50px_rgba(27,24,21,0.13)] mt-[28px]">
      <div className="pointer-events-none absolute inset-[5px] rounded-[3px] border border-rust/50" aria-hidden="true" />
      <div className={`relative flex flex-wrap items-center justify-between gap-3 ${PADX} py-[14px] bg-rust text-cream rounded-t-[3px]`}>
        <span className="inline-flex items-center gap-3">
          <Diamond className="w-3 h-3 text-mustard" />
          <span className={stub}>{title}</span>
        </span>
        {aside && <span className="font-label text-[12.5px] tracking-[0.22em] uppercase text-cream/75">{aside}</span>}
      </div>
      <div className="perf" aria-hidden="true" />
      <div className={`relative ${PADX} pt-[24px] pb-[clamp(24px,2.8vw,34px)]`}>{children}</div>
    </section>
  );
}

function Figure({ label, value, tone = "text-ink" }) {
  return (
    <div className="border-l-[3px] border-rust/70 pl-[16px]">
      <span className="block font-label text-[12px] font-semibold tracking-[0.28em] uppercase text-ink/50">{label}</span>
      <span className={`block font-display text-[clamp(28px,3.4vw,40px)] leading-none mt-[8px] tabular-nums ${tone}`}>{value}</span>
    </div>
  );
}

export default function Account() {
  const { user, loading } = useUser();
  const { upcoming } = useEvents();
  const [tickets, setTickets] = useState(null);
  const [busyId, setBusyId] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    document.title = "My tickets — Archer Events";
  }, []);

  // signed out: send them to the window, remembering where they were headed
  useEffect(() => {
    if (!loading && !user) window.location.replace("/login?next=/account");
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    let on = true;
    const load = () =>
      myRegistrations()
        .then((r) => on && setTickets(r))
        .catch(() => on && setTickets((t) => t || []));
    load();
    // the office confirms tickets by hand; picking the tab back up should show that
    const onFocus = () => document.visibilityState === "visible" && load();
    document.addEventListener("visibilitychange", onFocus);
    window.addEventListener("focus", onFocus);
    return () => {
      on = false;
      document.removeEventListener("visibilitychange", onFocus);
      window.removeEventListener("focus", onFocus);
    };
  }, [user]);

  if (loading || !user) return <main className="min-h-svh" />;

  const stall = user.role === "stall";
  const mine = tickets || [];
  const live = mine.filter((t) => t.status !== "cancelled");
  const stalls = live.filter((t) => t.role === "stall");
  const seats = live.filter((t) => t.role !== "stall");
  const cancelled = mine.filter((t) => t.status === "cancelled");
  const ahead = live.filter((t) => t.event && !t.event.over);
  const due = live.reduce((n, t) => n + (t.payment?.status === "paid" ? 0 : t.amount || 0), 0);

  async function onCancel(t) {
    if (!confirm(`Cancel your ticket for ${t.event?.title || "this event"}?`)) return;
    setBusyId(t.id);
    try {
      const saved = await cancelTicket(t.id);
      setTickets((rows) => rows.map((r) => (r.id === saved.id ? saved : r)));
      setNote("Ticket cancelled. You can register again any time.");
    } catch (err) {
      setNote(err.message || "That didn't work. Message us and we'll sort it.");
    } finally {
      setBusyId("");
    }
  }

  const list = (rows, empty) =>
    rows.length ? (
      rows.map((t) => <Ticket key={t.id} t={t} onCancel={onCancel} busy={busyId === t.id} />)
    ) : (
      <div className="py-[8px]">
        <p className="text-lead text-coffee">{empty}</p>
        <button type="button" className="btn mt-[18px]" onClick={() => openRegister({ role: stall ? "stall" : "visitor" })}>
          Find an event
        </button>
      </div>
    );

  return (
    <main className="relative px-[4vw] pt-[15vh] pb-[12vh] max-w-[1560px] mx-auto">
      <header className="flex flex-wrap items-end justify-between gap-x-[40px] gap-y-[20px]">
        <div>
          <p className="kicker"><Diamond className="w-2.5 h-2.5" /> Your ticket office <Diamond className="w-2.5 h-2.5" /></p>
          <h1 className="h-display text-[clamp(44px,6.5vw,88px)] leading-[0.95] text-ink">Hello, {firstName(user)}.</h1>
          <p className="mt-[14px] font-label text-[14px] font-medium tracking-[0.2em] uppercase text-ink/60">
            {ROLE_NAME[user.role]} · {user.phone}
          </p>
        </div>
        <button type="button" className="btn ghost" onClick={() => logout().then(() => window.location.assign("/"))}>
          Sign out
        </button>
      </header>

      {tickets !== null && (
        <div className="mt-[34px] grid gap-[24px] grid-cols-2 min-[900px]:grid-cols-4">
          <Figure label={stall ? "Bookings" : "Tickets"} value={live.length} />
          <Figure label="Still ahead" value={ahead.length} />
          <Figure label="To pay" value={due ? taka(due) : "—"} tone={due ? "text-rust" : "text-ink/35"} />
          <Figure label="Next up" value={ahead.length ? fmtDate(ahead[ahead.length - 1].event.startsAt).replace(/ \d{4}$/, "") : "—"} tone={ahead.length ? "text-ink" : "text-ink/35"} />
        </div>
      )}

      {note && (
        <p className="mt-[24px] px-[18px] py-[13px] border-[1.5px] border-rust/40 bg-rust/10 font-label text-[13px] tracking-[0.14em] uppercase text-rust">
          {note}
        </p>
      )}

      {stall && (
        <Section title="My stalls" aside={stalls.length ? `${stalls.length} booked` : null}>
          {tickets === null ? <p className="text-lead text-coffee">Loading…</p> : list(stalls, "No stalls booked yet.")}
        </Section>
      )}

      <Section title="My tickets" aside={(stall ? seats : live).length ? `${(stall ? seats : live).length} held` : null}>
        {tickets === null ? <p className="text-lead text-coffee">Loading…</p> : list(stall ? seats : live, "Nothing here yet.")}
      </Section>

      <Section title="Next on the calendar">
        {upcoming.length ? (
          upcoming.map((e) => {
            const price = stall && e.registration?.roles?.includes("stall") ? e.pricing?.stall : e.pricing?.visitor;
            const asStall = stall && e.registration?.roles?.includes("stall");
            return (
              <div
                key={e.slug}
                className="border-t border-line first:border-t-0 py-[18px] flex flex-wrap items-center gap-x-[28px] gap-y-[12px]"
              >
                <div className="min-w-[220px] flex-1">
                  <h3 className="font-display text-[clamp(18px,2vw,24px)] text-ink">{e.title}</h3>
                  <p className="mt-[5px] font-label text-[13px] tracking-[0.16em] uppercase text-ink/55">
                    {fmtDate(e.startsAt)} · {fmtTime(e.startsAt)}
                    {fmtWhere(e) ? ` · ${fmtWhere(e)}` : ""}
                  </p>
                </div>
                <span className="font-label text-[13px] tracking-[0.18em] uppercase text-ink/60">
                  {price ? taka(price) : "Free"}
                </span>
                <button
                  type="button"
                  className="btn px-[22px] py-[12px] text-[12px]"
                  onClick={() => openRegister({ event: e.slug, role: asStall ? "stall" : "visitor" })}
                >
                  {asStall ? "Book a stall" : "Register"}
                </button>
              </div>
            );
          })
        ) : (
          <p className="text-lead text-coffee">Nothing announced yet — we&rsquo;ll let you know.</p>
        )}
      </Section>

      {cancelled.length > 0 && (
        <Section title="Cancelled" aside={`${cancelled.length}`}>
          {cancelled.map((t) => (
            <Ticket key={t.id} t={t} onCancel={onCancel} busy={busyId === t.id} />
          ))}
        </Section>
      )}

      <Profile user={user} Section={Section} />
    </main>
  );
}
