import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { openRegister } from "./RegisterModal";

gsap.registerPlugin(ScrollTrigger);

const TARGET = new Date("2026-09-05T13:00:00+06:00").getTime();

function remaining() {
  const d = Math.max(0, TARGET - Date.now());
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor(d / 3600000) % 24,
    mins: Math.floor(d / 60000) % 60,
    secs: Math.floor(d / 1000) % 60,
    live: d === 0,
  };
}

/* Live card for the next real event: Offline Mela, Gulshan. */
export default function Countdown() {
  const rootRef = useRef(null);
  const [t, setT] = useState(remaining);

  useEffect(() => {
    const secEl = () => rootRef.current?.querySelector(".cd-cell:last-child .cd-num");
    const iv = setInterval(() => {
      setT(remaining());
      const el = secEl();
      if (el) gsap.fromTo(el, { scale: 1.16 }, { scale: 1, duration: 0.35, ease: "power2.out" });
    }, 1000);
    const ctx = gsap.context(() => {
      gsap.from(rootRef.current, {
        y: 60,
        opacity: 0,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: { trigger: rootRef.current, start: "top 85%", once: true },
      });
    }, rootRef);
    return () => {
      clearInterval(iv);
      ctx.revert();
    };
  }, []);

  const cells = [
    [t.days, "Days"],
    [t.hours, "Hrs"],
    [t.mins, "Min"],
    [t.secs, "Sec"],
  ];

  return (
    <aside
      className="vskew on-dark relative overflow-hidden bg-dark text-paper rounded-[28px] p-[clamp(27.5px,3vw,44.5px)] will-change-transform shadow-[0_30px_70px_rgba(10,10,10,0.25)] before:content-[''] before:absolute before:inset-0 before:pointer-events-none before:bg-[radial-gradient(ellipse_60%_55%_at_20%_10%,rgba(255,212,0,0.22),transparent_60%),radial-gradient(ellipse_55%_50%_at_85%_90%,rgba(255,150,0,0.14),transparent_60%)]"
      id="mela"
      ref={rootRef}
    >
      <div className="relative z-[1] flex flex-col items-start">
        <p className="text-fine font-bold tracking-[0.38em] uppercase text-goldb mb-[10.5px]">
          Next up — 5 Sep 2026, Gulshan
        </p>
        <h2 className="h-display text-[clamp(27.5px,3.4vw,44.5px)] text-paper">Offline Mela</h2>
        <p className="mt-[10.5px] text-golden text-paper-dim max-w-[36ch]">
          Your favourite online stores, in person. One day. Real people. Real connections.
        </p>
        {t.live ? (
          <div className="mt-[27.5px] font-display font-semibold text-quote text-goldb uppercase animate-cdpulse motion-reduce:animate-none">
            Happening now
          </div>
        ) : (
          <div className="flex gap-[10.5px] mt-[27.5px] self-stretch" role="timer" aria-label="Countdown to Offline Mela">
            {cells.map(([v, label]) => (
              <div
                className="cd-cell flex-1 flex flex-col items-center gap-[6.5px] py-[10.5px] bg-white/5 border border-white/10 rounded-[14px]"
                key={label}
              >
                <span className="cd-num font-display font-semibold text-quote leading-none text-goldb tabular-nums">
                  {String(v).padStart(2, "0")}
                </span>
                <span className="text-fine font-bold tracking-[0.3em] uppercase text-paper-dim">{label}</span>
              </div>
            ))}
          </div>
        )}
        <div className="flex flex-wrap gap-[17px] mt-[27.5px]">
          <a
            className="btn"
            href="#mela"
            onClick={(e) => {
              e.preventDefault();
              openRegister({ event: "mela", role: "Stall Vendor" });
            }}
          >
            Book your stall
          </a>
          <a
            className="btn ghost"
            href="#mela"
            onClick={(e) => {
              e.preventDefault();
              openRegister({ event: "mela", role: "Visitor" });
            }}
          >
            I'll visit
          </a>
        </div>
      </div>
    </aside>
  );
}
