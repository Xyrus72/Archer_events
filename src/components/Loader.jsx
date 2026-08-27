import { useEffect, useRef, useState } from "react";
import gsap from "gsap";

/* "ARCHER" letters rain down from above and land with a bounce,
   EVENTS spreads in beneath, then the curtain lifts. */
export default function Loader({ onDone }) {
  const rootRef = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setGone(true);
          onDone?.();
        },
      });
      tl.to(".ld-ch", {
        y: 0,
        rotate: 0,
        duration: 0.85,
        stagger: 0.075,
        ease: "back.out(1.35)",
      }, 0.25)
        .to(".ld-sub", { opacity: 1, y: 0, duration: 0.55, ease: "power3.out" }, "-=0.35")
        .to(".ld-lines i", { scaleX: 1, duration: 0.45, ease: "power3.out", stagger: 0.08 }, "<")
        .to(rootRef.current, {
          yPercent: -100,
          duration: 0.9,
          ease: "power4.inOut",
          delay: 0.4,
        });
    }, rootRef);
    return () => ctx.revert();
  }, [onDone]);

  const word = "ARCHER";
  const line =
    "block h-0.5 bg-goldb w-[clamp(40px,6vw,90px)] [transform:scaleX(0)_skewX(-35deg)] motion-reduce:[transform:scaleX(1)_skewX(-35deg)]";

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[300] bg-dark flex flex-col items-center justify-center gap-[26px] overflow-hidden will-change-transform ${
        gone ? "invisible pointer-events-none" : ""
      }`}
    >
      <div
        className="flex gap-[0.04em] font-display font-semibold text-[clamp(72px,13vw,188.5px)] leading-none text-paper uppercase"
        aria-label="Archer Events"
      >
        {[...word].map((c, i) => (
          <span
            key={i}
            className={`ld-ch inline-block will-change-transform [transform:translateY(-90vh)_rotate(8deg)] motion-reduce:[transform:none] ${
              i === 0 ? "text-goldb [text-shadow:0_0_60px_rgba(255,212,0,0.45)]" : ""
            }`}
          >
            {c}
          </span>
        ))}
      </div>
      <div className="ld-lines flex items-center gap-[18px]">
        <i className={`${line} origin-right`} />
        <span className="ld-sub font-body font-bold text-[clamp(10.5px,1.6vw,17px)] tracking-[0.62em] [text-indent:0.62em] uppercase text-paper opacity-0 [transform:translateY(14px)] motion-reduce:opacity-100 motion-reduce:[transform:none]">
          EVENTS
        </span>
        <i className={`${line} origin-left`} />
      </div>
    </div>
  );
}
