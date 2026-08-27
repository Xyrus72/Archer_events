import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitLine } from "../utils/split";
import { openRegister } from "./RegisterModal";

gsap.registerPlugin(ScrollTrigger);

const TILES = [
  {
    grad: "before:bg-[radial-gradient(ellipse_70%_90%_at_30%_100%,rgba(255,212,0,0.5),transparent_60%),radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(255,120,0,0.25),transparent_60%),#101010]",
    cat: "Concert",
    title: "Neon Nights Live, Dhaka",
  },
  {
    grad: "before:bg-[radial-gradient(ellipse_80%_70%_at_70%_30%,rgba(255,200,120,0.35),transparent_65%),radial-gradient(ellipse_60%_90%_at_20%_90%,rgba(190,60,40,0.3),transparent_60%),#120e0c]",
    cat: "Wedding",
    title: "The Rahman Reception",
  },
  {
    grad: "before:bg-[linear-gradient(140deg,rgba(255,212,0,0.22),transparent_45%),radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(70,90,140,0.35),transparent_70%),#0c0e12]",
    cat: "Corporate",
    title: "Summit '26 Keynote",
  },
  {
    grad: "before:bg-[radial-gradient(ellipse_60%_90%_at_80%_80%,rgba(255,212,0,0.4),transparent_60%),radial-gradient(ellipse_70%_60%_at_15%_20%,rgba(0,180,160,0.22),transparent_60%),#0d1010]",
    cat: "Mela",
    title: "Offline Mela — Gulshan",
  },
];

/* Final screen: expanding gallery + the ask, one dark band. */
export default function Showcase() {
  const rootRef = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ".show-tile",
        { y: 80, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          stagger: 0.08,
          ease: "none",
          scrollTrigger: {
            trigger: rootRef.current,
            start: "top 85%",
            end: "top 40%",
            scrub: 0.4,
          },
        }
      );
      // the ask climbs out letter-by-letter, tied to scroll
      gsap.to(".ch", {
        y: 0,
        rotate: 0,
        stagger: 0.02,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".cta-block",
          start: "top 95%",
          end: "top 55%",
          scrub: 0.4,
        },
      });
      gsap.fromTo(
        ".cta-actions",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: {
            trigger: ".cta-block",
            start: "top 80%",
            end: "top 45%",
            scrub: 0.4,
          },
        }
      );
    }, rootRef);

    // magnetic pull on the primary button
    const btn = rootRef.current.querySelector(".cta-actions .btn:not(.ghost)");
    const bx = gsap.quickTo(btn, "x", { duration: 0.35, ease: "power3.out" });
    const by = gsap.quickTo(btn, "y", { duration: 0.35, ease: "power3.out" });
    const move = (e) => {
      const r = btn.getBoundingClientRect();
      const cx = r.left + r.width / 2;
      const cy = r.top + r.height / 2;
      if (Math.hypot(e.clientX - cx, e.clientY - cy) < 160) {
        bx((e.clientX - cx) * 0.3);
        by((e.clientY - cy) * 0.3);
      } else {
        bx(0); by(0);
      }
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      ctx.revert();
    };
  }, []);

  return (
    <section
      className="on-dark relative z-[1] bg-dark text-paper px-[6vw] pt-[calc(2.5vw+6vh)] pb-[6vh] [clip-path:polygon(0_2.5vw,100%_0,100%_100%,0_100%)]"
      id="work"
      ref={rootRef}
    >
      <div className="max-w-[1560px] mx-auto">
        <div className="flex flex-wrap items-end justify-between gap-[17px]">
          <div>
            <p className="kicker">Recent productions</p>
            <h2 className="h-display text-heading text-paper">Moments we've made</h2>
          </div>
        </div>

        {/* hover-expanding gallery */}
        <div className="vskew mt-[44.5px] flex gap-[10px] h-[38vh] min-h-[260px] will-change-transform max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:h-auto">
          {TILES.map((t) => (
            <figure
              className={`show-tile group/tile relative overflow-hidden border border-linel flex items-end flex-1 hover:flex-[2.4] transition-[flex-grow] duration-[600ms] ease-[cubic-bezier(0.2,0.6,0.2,1)] max-[760px]:aspect-[4/3] before:content-[''] before:absolute before:inset-0 before:transition-transform before:duration-[600ms] hover:before:scale-[1.06] after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_top,rgba(7,7,5,0.85),transparent_55%)] ${t.grad}`}
              key={t.title}
            >
              <figcaption className="relative z-[2] p-[17px] flex flex-col gap-[6.5px]">
                <span className="text-fine font-bold tracking-[0.32em] uppercase text-goldb">{t.cat}</span>
                <span className="font-display font-semibold text-cardtitle uppercase tracking-[0.02em] text-paper whitespace-nowrap opacity-0 translate-y-2 transition-all duration-400 group-hover/tile:opacity-100 group-hover/tile:translate-y-0 max-[760px]:opacity-100 max-[760px]:translate-y-0 max-[760px]:whitespace-normal">
                  {t.title}
                </span>
              </figcaption>
            </figure>
          ))}
        </div>

        {/* the ask */}
        <div className="cta-block text-center mt-[7vh]" id="contact">
          <h2 className="h-display text-big text-paper">
            <SplitLine text="BE AT THE" />
            <SplitLine
              text="NEXT ONE."
              className="[&_.ch]:text-goldb [&_.ch]:[text-shadow:0_0_60px_rgba(255,212,0,0.4)]"
            />
          </h2>
          <div className="cta-actions flex flex-wrap justify-center gap-[17px] mt-[27.5px]">
            <a
              className="btn"
              href="#mela"
              onClick={(e) => {
                e.preventDefault();
                openRegister();
              }}
            >
              Register now
            </a>
            <a className="btn ghost" href="https://www.facebook.com/profile.php?id=61592698905669" target="_blank" rel="noreferrer">
              Follow on Facebook
            </a>
            <a className="btn ghost" href="tel:+8801767096181">
              01767-096181
            </a>
          </div>
        </div>
      </div>
    </section>
  );
}
