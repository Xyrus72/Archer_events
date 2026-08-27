import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

const EVENTS = [
  { id: "mela", name: "Offline Mela", meta: "5 Sep 2026 — Gulshan, Dhaka" },
];
const ROLES = ["Visitor", "Stall Vendor"];
const PHONE = "8801767096181";
const EMAIL = "archerevents.management@gmail.com";

export const openRegister = (preset) =>
  window.dispatchEvent(new CustomEvent("open-register", { detail: preset || {} }));

const field =
  "w-full bg-white/5 border border-white/10 rounded-[10.5px] px-[17px] py-[10.5px] text-golden text-paper placeholder:text-paper-dim outline-none transition-colors focus:border-goldb/60 [color-scheme:dark]";
const label = "block text-fine font-bold tracking-[0.3em] uppercase text-paper-dim mb-[6.5px]";
const chip = (active) =>
  `reg-chip px-[17px] py-[10.5px] text-fine font-bold tracking-[0.18em] uppercase rounded-full border transition-colors ${
    active
      ? "bg-goldb text-ink border-goldb"
      : "bg-transparent text-paper-dim border-white/15 hover:border-goldb/60 hover:text-paper"
  }`;

export default function RegisterModal() {
  const [open, setOpen] = useState(false);
  const [eventId, setEventId] = useState(EVENTS[0].id);
  const [role, setRole] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [note, setNote] = useState("");
  const cardRef = useRef(null);
  const backRef = useRef(null);

  useEffect(() => {
    const onOpen = (e) => {
      if (e.detail?.event) setEventId(e.detail.event);
      if (e.detail?.role) setRole(e.detail.role);
      setOpen(true);
    };
    window.addEventListener("open-register", onOpen);
    return () => window.removeEventListener("open-register", onOpen);
  }, []);

  useEffect(() => {
    if (!open) return;
    document.documentElement.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);

    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!reduced) {
      gsap.fromTo(backRef.current, { opacity: 0 }, { opacity: 1, duration: 0.35, ease: "power2.out" });
      gsap.fromTo(
        cardRef.current,
        { y: 60, scale: 0.94, opacity: 0 },
        { y: 0, scale: 1, opacity: 1, duration: 0.6, ease: "expo.out", delay: 0.05 }
      );
      gsap.fromTo(
        cardRef.current.querySelectorAll(".reg-chip"),
        { y: 14, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.45, stagger: 0.04, ease: "power3.out", delay: 0.2 }
      );
    }
    cardRef.current?.querySelector("input")?.focus?.();

    return () => {
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!open) return null;

  const ev = EVENTS.find((e) => e.id === eventId) || EVENTS[0];
  const message =
    `Hi Archer Events! I'd like to register for ${ev.name} (${ev.meta})` +
    (role ? ` as a ${role}` : "") +
    `.` +
    (name ? ` — ${name}` : "") +
    (phone ? ` (${phone})` : "") +
    (note ? `. ${note}` : "");

  const waHref = `https://wa.me/${PHONE}?text=${encodeURIComponent(message)}`;
  const mailHref = `mailto:${EMAIL}?subject=${encodeURIComponent(`Registration — ${ev.name}`)}&body=${encodeURIComponent(message)}`;
  const ready = role !== "";

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-[17px]" role="dialog" aria-modal="true" aria-label="Register for an event">
      <div
        ref={backRef}
        className="absolute inset-0 bg-[rgba(7,6,4,0.72)] backdrop-blur-[10px]"
        onClick={() => setOpen(false)}
      />
      <div
        ref={cardRef}
        className="on-dark relative w-[min(680px,100%)] max-h-[92svh] overflow-y-auto bg-dark text-paper rounded-[28px] p-[clamp(27.5px,4vw,44.5px)] border border-white/10 shadow-[0_40px_90px_rgba(0,0,0,0.6)] before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:rounded-[28px] before:bg-[radial-gradient(ellipse_60%_50%_at_15%_0%,rgba(255,212,0,0.18),transparent_60%)]"
      >
        <button
          className="absolute top-[17px] right-[17px] w-[44.5px] h-[44.5px] grid place-items-center rounded-full border border-white/15 text-paper-dim transition-colors hover:text-goldb hover:border-goldb/50 bg-transparent"
          aria-label="Close"
          onClick={() => setOpen(false)}
        >
          ✕
        </button>

        <p className="text-fine font-bold tracking-[0.38em] uppercase text-goldb mb-[6.5px]">Registration</p>
        <h3 className="h-display text-[clamp(27.5px,3.4vw,44.5px)] text-paper">Save your spot.</h3>
        <p className="mt-[6.5px] text-golden text-paper-dim">30 seconds — your registration lands straight in our WhatsApp.</p>

        <div className="mt-[27.5px]">
          <span className={label}>Event</span>
          <div className="flex flex-wrap gap-[10.5px]">
            {EVENTS.map((e) => (
              <button key={e.id} type="button" onClick={() => setEventId(e.id)} className={chip(eventId === e.id)}>
                {e.name} · {e.meta}
              </button>
            ))}
            <span className="reg-chip px-[17px] py-[10.5px] text-fine font-bold tracking-[0.18em] uppercase rounded-full border border-white/10 text-[rgba(246,245,241,0.3)]">
              More announcing soon
            </span>
          </div>
        </div>

        <div className="mt-[17px]">
          <span className={label}>I'm coming as</span>
          <div className="flex flex-wrap gap-[10.5px]">
            {ROLES.map((r) => (
              <button key={r} type="button" onClick={() => setRole(r)} className={chip(role === r)}>
                {r}
              </button>
            ))}
          </div>
          {role === "Stall Vendor" && (
            <p className="mt-[10.5px] text-golden text-paper-dim">
              Stalls include two 4ft × 2ft tables (~30 sq ft) for product display.
            </p>
          )}
        </div>

        <div className="mt-[17px] grid grid-cols-2 gap-[17px] max-[560px]:grid-cols-1">
          <div>
            <span className={label}>Your name</span>
            <input type="text" className={field} placeholder="Name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
          <div>
            <span className={label}>Phone</span>
            <input type="tel" className={field} placeholder="01XXXXXXXXX" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
        </div>

        <div className="mt-[17px]">
          <span className={label}>Anything else?</span>
          <textarea
            rows={2}
            className={`${field} resize-none`}
            placeholder="Your store / brand name, questions…"
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>

        <div className="mt-[27.5px] flex flex-wrap items-center gap-[17px]">
          <a
            className={`btn ${ready ? "" : "opacity-40 pointer-events-none"}`}
            href={waHref}
            target="_blank"
            rel="noreferrer"
            onClick={() => setOpen(false)}
          >
            Register on WhatsApp →
          </a>
          <a className="btn ghost" href={mailHref} onClick={() => setOpen(false)}>
            Email instead
          </a>
          {!ready && <span className="text-fine tracking-[0.18em] uppercase text-paper-dim">Visitor or vendor?</span>}
        </div>
      </div>
    </div>
  );
}
