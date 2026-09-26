import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { openRegister } from "./RegisterModal";
import { Seal } from "./Logo";
import { Diamond } from "./Ornaments";
import { fmtDay, fmtDate, fmtTime, useEvents } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

function remaining(iso) {
  const d = Math.max(0, new Date(iso).getTime() - Date.now());
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor(d / 3600000) % 24,
    mins: Math.floor(d / 60000) % 60,
    secs: Math.floor(d / 1000) % 60,
    live: d === 0,
  };
}

const PAD = "px-[clamp(20px,2.4vw,34px)]";
const stub = "font-label font-medium text-[12px] tracking-[0.34em] uppercase";

/* Admission ticket for whatever is next on the calendar: rust stub, perforation,
   flip-board countdown, seal stamped in the corner. With nothing scheduled it
   becomes an intermission card that collects "tell me first" sign-ups. */
export default function Countdown() {
  const rootRef = useRef(null);
  const { upcoming, past, loading, error } = useEvents();
  const next = upcoming[0] || null;
  const [t, setT] = useState(() => (next ? remaining(next.startsAt) : null));

  useEffect(() => {
    if (!next) return;
    setT(remaining(next.startsAt));
    const iv = setInterval(() => {
      setT(remaining(next.startsAt));
      const el = rootRef.current?.querySelector(".cd-cell:last-child .cd-num");
      if (el) gsap.fromTo(el, { scale: 1.16 }, { scale: 1, duration: 0.35, ease: "power2.out" });
    }, 1000);
    return () => clearInterval(iv);
  }, [next]);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        y: 60,
        rotation: -2,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
      });
    }, rootRef);
    return () => ctx.revert();
  }, []);

  const stalls = next?.registration?.roles?.includes("stall");
  const canRegister = next && next.registration?.open && !next.over;
  const last = past[0];

  return (
    <aside
      className="vskew relative bg-cream3 text-ink rounded-[6px] border-[3px] border-rust shadow-[0_30px_60px_rgba(27,24,21,0.18)] will-change-transform"
      id="next"
      ref={rootRef}
    >
      <div className="pointer-events-none absolute inset-[5px] rounded-[3px] border border-rust/50" aria-hidden="true" />

      {/* stub */}
      <div className={`relative flex items-center justify-between gap-3 ${PAD} py-[12px] bg-rust text-cream rounded-t-[3px]`}>
        <span className={stub}>
          {next ? `Next up · ${fmtDay(next.startsAt)} · ${next.venue || next.city}` : loading ? "Checking the calendar" : "Next up · announcing soon"}
        </span>
        <Diamond className="w-3 h-3 text-mustard" />
      </div>
      <div className="perf" aria-hidden="true" />

      <div className={`relative ${PAD} pt-[24px] pb-[clamp(22px,2.4vw,34px)]`}>
        <Seal className="absolute right-[18px] top-[16px] w-[68px] h-[68px] -rotate-12 hidden min-[520px]:block" />

        {next ? (
          <>
            <p className={`${stub} text-rust`}>{stalls ? "Visitors & stall vendors" : "Admit everyone"}</p>
            <h2 className="h-display text-[clamp(27.5px,3.2vw,42px)] text-ink mt-[6px] pr-[72px]">{next.title}</h2>
            <p className="mt-[10.5px] text-golden text-coffee max-w-[34ch]">
              {next.tagline || next.description}
            </p>
            <p className="mt-[8px] font-label text-[12.5px] font-medium tracking-[0.2em] uppercase text-ink/60">
              {fmtDate(next.startsAt)} · {fmtTime(next.startsAt)}
              {next.venue ? ` · ${next.venue}` : ""}
              {next.city ? `, ${next.city}` : ""}
            </p>

            {t?.live || next.live ? (
              <div className="mt-[24px] inline-flex items-center gap-3 font-display text-quote text-rust uppercase animate-cdpulse motion-reduce:animate-none">
                <Diamond className="w-4 h-4" /> Happening now
              </div>
            ) : (
              t && (
                <div className="flex gap-[8px] mt-[24px]" role="timer" aria-label={`Countdown to ${next.title}`}>
                  {[
                    [t.days, "Days"],
                    [t.hours, "Hrs"],
                    [t.mins, "Min"],
                    [t.secs, "Sec"],
                  ].map(([v, label]) => (
                    <div
                      className="cd-cell relative flex-1 flex flex-col items-center gap-[6px] py-[12px] bg-ink rounded-[4px] overflow-hidden after:content-[''] after:absolute after:left-0 after:right-0 after:top-[44%] after:h-px after:bg-cream/15"
                      key={label}
                    >
                      <span className="cd-num font-display text-quote leading-none text-mustard tabular-nums">
                        {String(v).padStart(2, "0")}
                      </span>
                      <span className="font-label text-[11px] font-medium tracking-[0.3em] uppercase text-cream/60">{label}</span>
                    </div>
                  ))}
                </div>
              )
            )}

            <div className="flex flex-wrap gap-[14px] mt-[24px]">
              {canRegister ? (
                stalls ? (
                  <>
                    <a className="btn" href="#next" onClick={(e) => { e.preventDefault(); openRegister({ event: next.slug, role: "stall" }); }}>
                      Book your stall
                    </a>
                    <a className="btn ghost" href="#next" onClick={(e) => { e.preventDefault(); openRegister({ event: next.slug, role: "visitor" }); }}>
                      I&rsquo;ll visit
                    </a>
                  </>
                ) : (
                  <>
                    <a className="btn" href="#next" onClick={(e) => { e.preventDefault(); openRegister({ event: next.slug }); }}>
                      Register now
                    </a>
                    <a className="btn ghost" href="tel:+8801767096181">Call us</a>
                  </>
                )
              ) : (
                <span className={`${stub} text-rust`}>Registration closed</span>
              )}
            </div>
          </>
        ) : (
          <>
            <p className={`${stub} text-rust`}>{loading ? "One moment" : "Intermission"}</p>
            <h2 className="h-display text-[clamp(27.5px,3.2vw,42px)] text-ink mt-[6px] pr-[72px]">
              {loading ? "Checking the calendar" : "The next one is in the works."}
            </h2>
            <p className="mt-[10.5px] text-golden text-coffee max-w-[36ch]">
              {loading
                ? "Pulling the latest dates."
                : last
                  ? `${last.title} wrapped on ${fmtDate(last.startsAt)}. Be first to hear when the next event drops.`
                  : error
                    ? "We couldn't reach the calendar right now. Call us and we'll fill you in."
                    : "Be first to hear when the next event drops."}
            </p>
            {!loading && (
              <div className="flex flex-wrap gap-[14px] mt-[24px]">
                <a className="btn" href="#next" onClick={(e) => { e.preventDefault(); openRegister({ interest: true }); }}>
                  Get first dibs
                </a>
                <a className="btn ghost" href="tel:+8801767096181">01767-096181</a>
              </div>
            )}
          </>
        )}
      </div>
    </aside>
  );
}
