import { useEffect } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import Lenis from "lenis";

gsap.registerPlugin(ScrollTrigger);

export default function SmoothScroll({ children }) {
  useEffect(() => {
    const lenis = new Lenis({ lerp: 0.1, smoothWheel: true });

    // velocity skew: content leans with scroll speed, settles when you stop
    let skewSetters = null;
    let settle;
    lenis.on("scroll", (e) => {
      ScrollTrigger.update();
      if (!skewSetters) {
        skewSetters = [...document.querySelectorAll(".vskew")].map((el) =>
          gsap.quickTo(el, "skewY", { duration: 0.5, ease: "power3.out" })
        );
      }
      const s = gsap.utils.clamp(-2, 2, e.velocity * 0.045);
      skewSetters.forEach((fn) => fn(s));
      clearTimeout(settle);
      settle = setTimeout(() => skewSetters?.forEach((fn) => fn(0)), 90);
    });
    const raf = (time) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);
    gsap.ticker.lagSmoothing(0);

    // glide to anchors instead of jumping
    const onClick = (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const el = document.querySelector(a.getAttribute("href"));
      if (!el) return;
      e.preventDefault();
      lenis.scrollTo(el, { offset: -70, duration: 1.5, easing: (t) => 1 - Math.pow(1 - t, 4) });
    };
    document.addEventListener("click", onClick);

    return () => {
      clearTimeout(settle);
      document.removeEventListener("click", onClick);
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return children;
}
