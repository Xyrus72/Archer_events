import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { SplitLine } from "../utils/split";
import { openRegister } from "./RegisterModal";
import { Diamond, Stripes, Sunrise } from "./Ornaments";
import { api, KIND_LABEL } from "../lib/api";

gsap.registerPlugin(ScrollTrigger);

/* Until the office uploads photographs, the strip shows the events that actually ran,
   on warm gradients, so the section never shows work that was not done. */
const GRADS = [
  "before:bg-[radial-gradient(ellipse_70%_90%_at_30%_100%,rgba(217,164,39,0.6),transparent_60%),radial-gradient(ellipse_60%_80%_at_80%_20%,rgba(232,117,44,0.4),transparent_60%),#1f1710]",
  "before:bg-[radial-gradient(ellipse_80%_70%_at_70%_30%,rgba(242,224,190,0.35),transparent_65%),radial-gradient(ellipse_60%_90%_at_20%_90%,rgba(181,71,30,0.55),transparent_60%),#241812]",
  "before:bg-[linear-gradient(140deg,rgba(124,132,100,0.55),transparent_45%),radial-gradient(ellipse_90%_60%_at_50%_100%,rgba(217,164,39,0.35),transparent_70%),#1a1d18]",
  "before:bg-[radial-gradient(ellipse_60%_90%_at_80%_80%,rgba(232,117,44,0.55),transparent_60%),radial-gradient(ellipse_70%_60%_at_15%_20%,rgba(217,164,39,0.32),transparent_60%),#22160f]",
];

/* Final screen: expanding postcard gallery + the ask, one dark band. */
export default function Showcase() {
  const rootRef = useRef(null);
  const [shots, setShots] = useState(null);
  const [held, setHeld] = useState([]);

  useEffect(() => {
    let on = true;
    api.get("/api/gallery")
      .then((d) => on && setShots(d.gallery))
      .catch(() => on && setShots([]));
    api.get("/api/events")
      .then((d) => {
        if (!on) return;
        const past = [...(d.past || [])].sort((x, y) => new Date(y.startsAt) - new Date(x.startsAt));
        setHeld(
          past.slice(0, 4).map((e, i) => ({
            id: e.id,
            title: [e.title, e.venue].filter(Boolean).join(", "),
            cat: KIND_LABEL[e.kind] || "Event",
            grad: GRADS[i % GRADS.length],
          }))
        );
      })
      .catch(() => {});
    return () => {
      on = false;
    };
  }, []);

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
          scrollTrigger: { trigger: rootRef.current, start: "top 85%", end: "top 40%", scrub: 0.4 },
        }
      );
      // the ask climbs out letter-by-letter, tied to scroll
      gsap.to(".ch", {
        y: 0,
        rotate: 0,
        stagger: 0.02,
        ease: "power2.out",
        scrollTrigger: { trigger: ".cta-block", start: "top 95%", end: "top 55%", scrub: 0.4 },
      });
      gsap.fromTo(
        ".cta-actions",
        { y: 30, opacity: 0 },
        {
          y: 0,
          opacity: 1,
          ease: "none",
          scrollTrigger: { trigger: ".cta-block", start: "top 80%", end: "top 45%", scrub: 0.4 },
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
        bx(0);
        by(0);
      }
    };
    window.addEventListener("pointermove", move);
    return () => {
      window.removeEventListener("pointermove", move);
      ctx.revert();
    };
  }, []);

  return (
    <section className="on-dark relative z-[1] bg-ink text-cream" id="work" ref={rootRef}>
      <Stripes />
      <div className="px-[6vw] pt-[8vh] pb-[7vh]">
        <div className="max-w-[1560px] mx-auto">
          <div className="flex flex-wrap items-end justify-between gap-[17px]">
            <div>
              <p className="kicker">
                <Diamond className="w-2.5 h-2.5" /> Recent productions <Diamond className="w-2.5 h-2.5" />
              </p>
              <h2 className="h-display text-heading text-cream">Moments we&rsquo;ve made</h2>
            </div>
            <Sunrise className="w-[110px] text-mustard/70 hidden min-[761px]:block" flip />
          </div>

          {/* hover-expanding postcard gallery */}
          <div className="vskew mt-[44.5px] flex gap-[12px] h-[38vh] min-h-[260px] will-change-transform max-[760px]:grid max-[760px]:grid-cols-2 max-[760px]:h-auto">
            {(shots?.length ? shots : held).map((t) => (
              <figure
                className={`show-tile group/tile relative overflow-hidden border-[5px] border-cream3 flex items-end flex-1 hover:flex-[2.4] transition-[flex-grow] duration-[600ms] ease-[cubic-bezier(0.2,0.6,0.2,1)] max-[760px]:aspect-[4/3] before:content-[''] before:absolute before:inset-0 before:transition-transform before:duration-[600ms] hover:before:scale-[1.06] after:content-[''] after:absolute after:inset-0 after:bg-[linear-gradient(to_top,rgba(42,29,18,0.85),transparent_55%)] ${t.grad || "bg-ink2"}`}
                key={t.id || t.title}
              >
                {t.url && (
                  <img
                    src={t.url}
                    alt={t.alt || ""}
                    loading="lazy"
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-[600ms] group-hover/tile:scale-[1.06]"
                  />
                )}
                {(t.category || t.cat) && (
                  <span className="absolute top-[12px] left-[12px] z-[2] px-[10px] py-[5px] bg-rust text-cream font-label text-[11px] font-semibold tracking-[0.3em] uppercase">
                    {t.category || t.cat}
                  </span>
                )}
                <figcaption className="relative z-[2] p-[17px] w-full">
                  <span className="block font-display text-cardtitle text-cream whitespace-nowrap opacity-0 translate-y-2 transition-all duration-400 group-hover/tile:opacity-100 group-hover/tile:translate-y-0 max-[760px]:opacity-100 max-[760px]:translate-y-0 max-[760px]:whitespace-normal">
                    {t.title}
                  </span>
                </figcaption>
              </figure>
            ))}
          </div>

          {/* the ask */}
          <div className="cta-block text-center mt-[8vh]" id="contact">
            <h2 className="h-display text-big text-cream">
              <SplitLine text="BE AT THE" />
              <SplitLine
                text="NEXT ONE."
                className="[&_.ch]:text-mustard [&_.ch]:[text-shadow:0_0_50px_rgba(217,164,39,0.35)]"
              />
            </h2>
            <div className="cta-actions flex flex-wrap justify-center gap-[17px] mt-[27.5px]">
              <a
                className="btn"
                href="#next"
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
      </div>
    </section>
  );
}
