import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { openRegister } from "./RegisterModal";

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  ["120+", "events"],
  ["300K+", "guests"],
  ["12", "cities"],
];

/* Puzzle pieces: each char is a free-floating span (no line mask) so it can
   fly in from anywhere on screen and snap into place. */
function Puzzle({ text, className = "" }) {
  return (
    <span className={`inline-block ${className}`}>
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

  useEffect(() => {
    if (!started) return;
    videoRef.current?.play?.().catch(() => {});

    const ctx = gsap.context(() => {
      // cinematic reveal: letterbox slit opens onto the film, the headline
      // rains in, the video pill pops, the italic payoff lands last
      gsap
        .timeline({ defaults: { ease: "expo.out" } })
        .fromTo(
          ".hero-media",
          { clipPath: "inset(46% 4% 46% 4% round 18px)" },
          { clipPath: "inset(0% 0% 0% 0% round 0px)", duration: 1.5 },
          0.05
        )
        .fromTo(".hero-video", { scale: 1.25 }, { scale: 1, duration: 1.9 }, 0)
        .to(".hero-kicker", { opacity: 1, y: 0, duration: 0.8 }, 0.7)
        // puzzle assembly: chars fly in blurred from random points, rotate and lock
        .fromTo(
          ".pz",
          {
            x: () => gsap.utils.random(-280, 280),
            y: () => gsap.utils.random(-220, 220),
            rotation: () => gsap.utils.random(-150, 150),
            scale: () => gsap.utils.random(0.3, 1.8),
            opacity: 0,
            filter: "blur(12px)",
          },
          {
            x: 0,
            y: 0,
            rotation: 0,
            scale: 1,
            opacity: 1,
            filter: "blur(0px)",
            duration: 1.4,
            ease: "power4.inOut",
            stagger: { each: 0.022, from: "random" },
          },
          0.55
        )
        // the lock-in: a breath of overscale + the gold word flares
        .fromTo(".hero-title", { scale: 1 }, { scale: 1.015, duration: 0.12, ease: "power2.in" }, 2.1)
        .to(".hero-title", { scale: 1, duration: 0.5, ease: "elastic.out(1.4,0.4)" }, 2.22)
        .fromTo(
          ".hero-gold",
          { textShadow: "0 0 0px rgba(255,212,0,0)" },
          { textShadow: "0 0 90px rgba(255,212,0,0.65)", duration: 0.5, ease: "power2.out" },
          2.15
        )
        .to(".hero-gold", { textShadow: "0 0 60px rgba(255,212,0,0.4)", duration: 0.8 }, 2.65)
        .to(".hero-ctas", { opacity: 1, y: 0, duration: 0.9 }, 2.3)
        .to(".hero-stats", { opacity: 1, y: 0, duration: 0.9 }, 2.45)
        .to(".hero-cue", { opacity: 1, duration: 0.8 }, 2.55);

      // scroll exit: the film zooms and sinks, the frame darkens, copy lifts away
      const scrub = (end) => ({
        trigger: rootRef.current,
        start: "top top",
        end,
        scrub: true,
      });
      gsap.to(".hero-video", { scale: 1.14, ease: "none", scrollTrigger: scrub("bottom top") });
      gsap.to(".hero-media", { yPercent: 14, ease: "none", scrollTrigger: scrub("bottom top") });
      gsap.to(".hero-darken", { opacity: 0.55, ease: "none", scrollTrigger: scrub("bottom 40%") });
      gsap.to(".hero-copy", { yPercent: -26, opacity: 0, ease: "none", scrollTrigger: scrub("bottom 55%") });
    }, rootRef);

    // cursor: film plane drifts, headline tilts in 3D toward the pointer
    const media = rootRef.current.querySelector(".hero-media");
    const tilt = rootRef.current.querySelector(".hero-tilt");
    const mx = gsap.quickTo(media, "x", { duration: 1.2, ease: "power3.out" });
    const my = gsap.quickTo(media, "y", { duration: 1.2, ease: "power3.out" });
    const rx = gsap.quickTo(tilt, "rotationX", { duration: 0.9, ease: "power3.out" });
    const ry = gsap.quickTo(tilt, "rotationY", { duration: 0.9, ease: "power3.out" });
    const onMove = (e) => {
      const nx = e.clientX / innerWidth - 0.5;
      const ny = e.clientY / innerHeight - 0.5;
      mx(nx * -14);
      my(ny * -10);
      ry(nx * 5);
      rx(ny * -4);
    };
    window.addEventListener("pointermove", onMove);

    return () => {
      window.removeEventListener("pointermove", onMove);
      ctx.revert();
    };
  }, [started]);

  return (
    <section className="on-dark relative h-svh overflow-hidden bg-dark" id="top" ref={rootRef}>
      {/* film plane — bleeds past the viewport so cursor parallax never shows an edge */}
      <div
        className="hero-media absolute -inset-7 z-0 [clip-path:inset(46%_4%_46%_4%_round_18px)] [will-change:transform,clip-path] motion-reduce:[clip-path:none]! motion-reduce:bg-[radial-gradient(ellipse_70%_80%_at_60%_40%,rgba(255,212,0,0.18),transparent_65%),#0c0b08]"
        aria-hidden="true"
      >
        <video
          ref={videoRef}
          className="hero-video block w-full h-full object-cover [transform:scale(1.25)] will-change-transform motion-reduce:hidden"
          src="/hero.mp4"
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
          disablePictureInPicture
        />
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(ellipse_90%_75%_at_50%_50%,rgba(7,6,4,0.62),rgba(7,6,4,0.28)_55%,rgba(7,6,4,0.5)),linear-gradient(to_top,rgba(7,6,4,0.85),transparent_35%),linear-gradient(to_bottom,rgba(7,6,4,0.5),transparent_28%)]" />
        <div className="hero-darken absolute inset-0 bg-[#070604] opacity-0 pointer-events-none" />
      </div>

      {/* center stage */}
      <div className="hero-copy absolute inset-0 z-[2] flex flex-col items-center justify-center text-center px-[6vw] [will-change:transform,opacity] [perspective:900px]">
        <p className="hero-kicker text-fine font-semibold tracking-[0.4em] uppercase text-goldb mb-[27.5px] opacity-0 [transform:translateY(16px)] motion-reduce:opacity-100! motion-reduce:[transform:none]!">
          Archer Events — Dhaka, Bangladesh
        </p>

        <div className="hero-tilt [transform-style:preserve-3d] will-change-transform">
          <h1 className="hero-title will-change-transform">
            <span className="block font-fancy font-medium text-quote leading-none text-[rgba(246,245,241,0.8)]">
              <Puzzle text="More than events." />
            </span>
            <span className="block h-display text-[clamp(44.5px,7.8vw,116.5px)] max-[640px]:text-[clamp(27.5px,9.5vw,44.5px)] leading-[0.96] text-paper mt-[0.12em]">
              <Puzzle text="WE CREATE" />
            </span>
            <span className="hero-gold block font-fancy font-semibold text-[clamp(72px,10.4vw,188.5px)] max-[640px]:text-[clamp(44.5px,13.5vw,72px)] leading-[0.92] text-goldb mt-[0.02em]">
              <Puzzle text="Experiences." />
            </span>
          </h1>
        </div>

        <div className="hero-ctas flex flex-wrap justify-center gap-[17px] mt-[44.5px] opacity-0 [transform:translateY(22px)] motion-reduce:opacity-100! motion-reduce:[transform:none]!">
          <a
            className="btn"
            href="#mela"
            data-magnet
            onClick={(e) => {
              e.preventDefault();
              openRegister();
            }}
          >
            Register now
          </a>
          <a className="btn ghost" href="#mela">Next event</a>
        </div>

        <div className="hero-stats flex flex-wrap justify-center gap-[27.5px] mt-[27.5px] opacity-0 [transform:translateY(18px)] motion-reduce:opacity-100! motion-reduce:[transform:none]!">
          {STATS.map(([n, label]) => (
            <span key={label} className="text-fine font-semibold tracking-[0.3em] uppercase text-[rgba(246,245,241,0.55)]">
              <b className="text-goldb tabular-nums font-bold">{n}</b> {label}
            </span>
          ))}
        </div>
      </div>

      <div className="hero-cue absolute bottom-[4.5vh] right-[6vw] z-[2] hidden min-[641px]:flex flex-col items-center gap-2.5 text-[rgba(246,245,241,0.65)] text-fine font-semibold tracking-[0.34em] [text-indent:0.34em] uppercase opacity-0 motion-reduce:opacity-100! after:content-[''] after:w-0.5 after:h-9 after:bg-[linear-gradient(to_bottom,var(--color-goldb),transparent)] after:animate-cue motion-reduce:after:animate-none">
        Scroll
      </div>
    </section>
  );
}
