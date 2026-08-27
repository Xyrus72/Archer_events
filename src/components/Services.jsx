import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Countdown from "./Countdown";

gsap.registerPlugin(ScrollTrigger);

const SERVICES = [
  { n: "01", title: "Corporate Events", desc: "Summits, conferences and town halls that carry your brand's weight from stage to seat." },
  { n: "02", title: "Concerts & Shows", desc: "Full-scale live production — staging, sound and light tuned for goosebumps." },
  { n: "03", title: "Weddings", desc: "Holud to reception, choreographed like cinema. Moments your families keep forever." },
  { n: "04", title: "Brand Activations", desc: "Launches, pop-ups and campaigns that turn footfall into fandom." },
  { n: "05", title: "Melas & Festivals", desc: "From Offline Mela to multi-day festivals — run with precision logistics." },
  { n: "06", title: "Themed Nights", desc: "Masquerade balls, karaoke nights and concept parties built from scratch." },
];

/* One viewport: services as a hover-expanding index (left, φ share)
   beside the live Offline Mela card (right). */
export default function Services() {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".svc-head, .svc-row",
        { y: 34, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.06,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 82%",
            end: "top 30%",
            scrub: 0.4,
          },
        }
      );
    }, rootRef);
    return () => ctx.revert();
  }, []);

  return (
    <section
      className="relative z-[1] min-h-svh flex items-center px-[6vw] py-[8vh]"
      id="services"
      ref={rootRef}
    >
      <div className="w-full max-w-[1560px] mx-auto grid items-center gap-x-[4vw] gap-y-[44.5px] grid-cols-1 min-[981px]:grid-cols-[1.618fr_1fr]">
        <div>
          <div className="svc-head">
            <p className="kicker">What we do</p>
            <h2 className="h-display text-heading">Full-stack event production</h2>
          </div>
          <div className="mt-[27.5px]">
            {SERVICES.map((s) => (
              <div
                className="svc-row group border-b border-line first:border-t py-[17px] transition-[padding-left] duration-300 ease-out hover:pl-[10px]"
                key={s.n}
              >
                <div className="flex items-baseline gap-[17px]">
                  <span className="text-fine font-bold text-gold tabular-nums">{s.n}</span>
                  <h3 className="font-display font-semibold uppercase tracking-[0.01em] text-[clamp(17px,2.2vw,27.5px)] transition-colors duration-300 group-hover:text-gold">
                    {s.title}
                  </h3>
                  <span className="ml-auto text-gold opacity-0 -translate-x-1.5 transition-all duration-300 group-hover:opacity-100 group-hover:translate-x-0">
                    →
                  </span>
                </div>
                <div className="grid [grid-template-rows:0fr] group-hover:[grid-template-rows:1fr] max-[980px]:[grid-template-rows:1fr] transition-[grid-template-rows] duration-[400ms] ease-[cubic-bezier(0.2,0.6,0.2,1)]">
                  <p className="overflow-hidden text-dim text-golden leading-golden max-w-[52ch] group-hover:pt-[6.5px] max-[980px]:pt-[6.5px]">
                    {s.desc}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
        <Countdown />
      </div>
    </section>
  );
}
