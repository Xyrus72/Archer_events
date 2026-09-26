import { Fragment, useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { openRegister } from "./RegisterModal";
import { Diamond } from "./Ornaments";
import Scene from "./scene/Scene";
import { useSettings } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

/* The poster, moving: the film is the artwork, so it plays at full strength and the
   copy sits up in its cream sky. Where the film will not play — reduced motion, a
   stalled load — the same scene drawn in SVG stands in for it. */

function Puzzle({ text }) {
  return (
    <span className="inline-block">
      {[...text].map((c, i) =>
        c === " " ? (
          <span key={i} className="inline-block w-[0.26em]" />
        ) : (
          <span key={i} className="pz inline-block will-change-transform opacity-0 motion-reduce:opacity-100!">
            {c}
          </span>
        )
      )}
    </span>
  );
}

export default function Hero({ started }) {
  const rootRef = useRef(null);
  const videoRef = useRef(null);
  // defaults paint at once; the office's edits swap in when /api/settings answers
  const { heroStats } = useSettings();

  useEffect(() => {
    if (!started) return;
    videoRef.current?.play?.().catch(() => {});

    const ctx = gsap.context(() => {
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .from(".hero-film", { scale: 1.12, duration: 2.6, ease: "power2.out" }, 0)
        .to(".hero-kicker", { opacity: 1, y: 0, duration: 0.8 }, 0.5)
        .fromTo(
          ".pz",
          {
            x: () => gsap.utils.random(-200, 200),
            y: () => gsap.utils.random(-160, 160),
            rotation: () => gsap.utils.random(-90, 90),
            opacity: 0,
            filter: "blur(10px)",
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.3,
            ease: "power4.inOut",
            stagger: { each: 0.02, from: "random" },
          },
          0.45
        )
        .to(".hero-ctas", { opacity: 1, y: 0, duration: 0.9 }, 1.6)
        .to(".hero-stats", { opacity: 1, y: 0, duration: 0.9 }, 1.75)
        .to(".hero-cue", { opacity: 1, duration: 0.8 }, 2);

      // scrolling away: the copy lifts off the paper, the film settles behind it
      const scrub = (end) => ({ trigger: rootRef.current, start: "top top", end, scrub: true });
      gsap.to(".hero-copy", { yPercent: -34, opacity: 0, ease: "none", scrollTrigger: scrub("bottom 55%") });
      gsap.to(".hero-film", { scale: 1.07, ease: "none", scrollTrigger: scrub("bottom top") });
    }, rootRef);

    return () => ctx.revert();
  }, [started]);

  return (
    <section className="relative h-svh min-h-[620px] overflow-hidden bg-cream" id="top" ref={rootRef}>
      {/* the film is the poster */}
      <div className="hero-film absolute inset-0 z-0 overflow-hidden will-change-transform" aria-hidden="true">
        <video
          ref={videoRef}
          className="hero-video block w-full h-full object-cover motion-reduce:hidden"
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
        />
        {/* the drawn scene stands in wherever the film will not play */}
        <Scene className="hidden motion-reduce:block absolute inset-0 w-full h-full" />
      </div>

      {/* cream held over the sky so the headline always has paper under it */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none bg-[linear-gradient(to_bottom,rgba(242,227,192,0.97)_0%,rgba(242,227,192,0.94)_38%,rgba(242,227,192,0.8)_56%,rgba(242,227,192,0.32)_73%,transparent_88%)]"
        aria-hidden="true"
      />

      {/* what we want read */}
      <div className="hero-copy relative z-[3] h-full flex flex-col items-center text-center px-[6vw] pt-[max(12vh,104px)]">
        <p className="hero-kicker inline-flex items-center gap-3 font-label font-medium text-[13px] tracking-[0.4em] uppercase text-rust mb-[22px] opacity-0 [transform:translateY(16px)] motion-reduce:opacity-100! motion-reduce:[transform:none]!">
          <Diamond className="w-3 h-3" /> Archer Events &middot; Dhaka, Bangladesh <Diamond className="w-3 h-3" />
        </p>

        <h1 className="max-w-[min(1100px,92vw)]">
          <span className="block font-fancy italic font-medium text-quote leading-none text-coffee">
            <Puzzle text="More than events." />
          </span>
          <span className="block h-crest text-[clamp(34px,6.4vw,92px)] max-[640px]:text-[clamp(28px,9vw,40px)] text-ink mt-[0.14em]">
            <Puzzle text="WE CREATE" />
          </span>
          <span className="block font-fancy italic font-extrabold text-[clamp(46px,8vw,124px)] max-[640px]:text-[clamp(38px,11.5vw,60px)] leading-[0.95] text-rust mt-[0.02em]">
            <Puzzle text="Experiences." />
          </span>
        </h1>

        <div className="hero-ctas flex flex-wrap justify-center gap-[17px] mt-[28px] opacity-0 [transform:translateY(22px)] motion-reduce:opacity-100! motion-reduce:[transform:none]!">
          <button type="button" className="btn" data-magnet onClick={() => openRegister()}>
            Register now
          </button>
          <a className="btn ghost" href="#next">Next event</a>
        </div>

        <div className="hero-stats flex flex-wrap justify-center items-center gap-[17px] mt-[24px] opacity-0 [transform:translateY(18px)] motion-reduce:opacity-100! motion-reduce:[transform:none]!">
          {heroStats.map(({ value, label }, i) => (
            <Fragment key={`${value}-${label}`}>
              {i > 0 && <Diamond className="w-2.5 h-2.5 text-rust" />}
              <span className="font-label text-[13px] font-medium tracking-[0.3em] uppercase text-coffee">
                <b className="text-rust font-semibold tabular-nums">{value}</b> {label}
              </span>
            </Fragment>
          ))}
        </div>
      </div>

      <div className="hero-cue absolute bottom-[3vh] right-[6vw] z-[4] hidden min-[641px]:flex flex-col items-center gap-2.5 text-cream/80 font-label text-[12px] font-medium tracking-[0.34em] [text-indent:0.34em] uppercase opacity-0 motion-reduce:opacity-100! after:content-[''] after:w-0.5 after:h-9 after:bg-[linear-gradient(to_bottom,var(--color-cream),transparent)] after:animate-cue motion-reduce:after:animate-none">
        Scroll
      </div>
    </section>
  );
}
