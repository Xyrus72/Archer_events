import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { Crest } from "./Logo";

/* The crest assembles itself: badge sets, sun rises, rays fan out,
   the arrow drops in, the wordmark lands, the ribbon unrolls, the star pops,
   then the curtain lifts. */
export default function Loader({ onDone }) {
  const rootRef = useRef(null);
  const [gone, setGone] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const ctx = gsap.context(() => {
      const tl = gsap.timeline({
        onComplete: () => {
          setGone(true);
          onDone?.();
        },
      });
      if (!reduced) {
        tl.from(".lg-body", { scale: 0.82, opacity: 0, transformOrigin: "50% 50%", duration: 0.7, ease: "expo.out" }, 0.1)
          .from(".lg-sun", { y: 320, opacity: 0, duration: 0.9, ease: "power3.out" }, 0.2)
          .from(".lg-ray-l", { scaleX: 0, transformOrigin: "100% 50%", duration: 0.45, stagger: 0.05, ease: "power3.out" }, 0.55)
          .from(".lg-ray-r", { scaleX: 0, transformOrigin: "0% 50%", duration: 0.45, stagger: 0.05, ease: "power3.out" }, 0.55)
          .from(".lg-arrow", { y: 220, opacity: 0, duration: 0.7, ease: "back.out(1.6)" }, 0.7)
          .from(".lg-word", { y: 50, opacity: 0, duration: 0.6, ease: "power3.out" }, 0.85)
          .from(".lg-band", { scaleX: 0, transformOrigin: "50% 50%", duration: 0.55, ease: "expo.out" }, 1.0)
          .from(".lg-star", { scale: 0, rotation: 90, transformOrigin: "50% 50%", duration: 0.45, ease: "back.out(2.2)" }, 1.2)
          .from(".ld-tag", { opacity: 0, y: 10, duration: 0.45, ease: "power2.out" }, 1.25);
      }
      tl.to(rootRef.current, {
        yPercent: -100,
        duration: 0.9,
        ease: "power4.inOut",
        delay: reduced ? 0.3 : 0.45,
      });
    }, rootRef);
    return () => ctx.revert();
  }, [onDone]);

  return (
    <div
      ref={rootRef}
      className={`fixed inset-0 z-[300] bg-cream flex flex-col items-center justify-center gap-[27.5px] overflow-hidden will-change-transform ${
        gone ? "invisible pointer-events-none" : ""
      }`}
    >
      <div className="sunburst opacity-80" aria-hidden="true" />
      <Crest className="relative w-[clamp(260px,46vw,620px)] h-auto drop-shadow-[0_24px_40px_rgba(27,24,21,0.18)]" />
      <p className="ld-tag relative font-label font-medium text-[12.5px] tracking-[0.42em] [text-indent:0.42em] uppercase text-rust">
        Dhaka, Bangladesh
      </p>
    </div>
  );
}
