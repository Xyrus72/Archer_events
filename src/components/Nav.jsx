import { useEffect, useState } from "react";
import Mark from "./Mark";
import { openRegister } from "./RegisterModal";

const LINKS = [
  ["What we do", "#services"],
  ["Work", "#work"],
  ["Offline Mela", "#mela"],
  ["Contact", "#contact"],
];

export default function Nav() {
  const [solid, setSolid] = useState(false);
  const [open, setOpen] = useState(false);
  const [progress, setProgress] = useState(0);
  const [clock, setClock] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setSolid(window.scrollY > 40);
      const max = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(max > 0 ? window.scrollY / max : 0);
    };
    onScroll();
    addEventListener("scroll", onScroll, { passive: true });

    const fmt = new Intl.DateTimeFormat("en-GB", {
      timeZone: "Asia/Dhaka",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
    const tick = () => setClock(fmt.format(new Date()));
    tick();
    const iv = setInterval(tick, 10_000);

    return () => {
      removeEventListener("scroll", onScroll);
      clearInterval(iv);
    };
  }, []);

  // over the dark video hero (not scrolled, menu closed) the nav runs light
  const light = !solid && !open;

  const shell = open
    ? "bg-[linear-gradient(155deg,rgba(246,245,241,0.85),rgba(246,245,241,0.7))] border-line shadow-[0_12px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.22)] py-3"
    : solid
      ? "bg-[linear-gradient(155deg,rgba(246,245,241,0.72),rgba(246,245,241,0.5))] border-line shadow-[0_12px_34px_rgba(10,10,10,0.12),inset_0_1px_0_rgba(255,255,255,0.7)] py-[9px]"
      : "bg-[linear-gradient(155deg,rgba(255,255,255,0.12),rgba(255,255,255,0.04))] border-[rgba(255,255,255,0.16)] shadow-[0_12px_40px_rgba(0,0,0,0.18),inset_0_1px_0_rgba(255,255,255,0.22)] py-3";

  const linkCls = `relative py-1.5 text-fine font-semibold tracking-[0.22em] uppercase transition-colors ${
    light ? "text-[rgba(246,245,241,0.78)] hover:text-white" : "text-dim hover:text-ink"
  } after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-gold after:origin-left after:scale-x-0 after:-skew-x-[30deg] after:transition-transform after:duration-300 hover:after:scale-x-100 ${
    open ? "max-[860px]:py-3.5 max-[860px]:text-golden" : ""
  }`;

  const linksWrap = `gap-[3vw] hidden min-[861px]:flex ${
    open
      ? "max-[860px]:flex max-[860px]:absolute max-[860px]:top-[calc(100%+10px)] max-[860px]:left-0 max-[860px]:right-0 max-[860px]:flex-col max-[860px]:gap-0 max-[860px]:bg-[linear-gradient(155deg,rgba(246,245,241,0.9),rgba(246,245,241,0.75))] max-[860px]:backdrop-blur-[20px] max-[860px]:backdrop-saturate-[1.6] max-[860px]:border max-[860px]:border-line max-[860px]:rounded-2xl max-[860px]:shadow-[0_16px_44px_rgba(10,10,10,0.14)] max-[860px]:px-6 max-[860px]:pt-3 max-[860px]:pb-5"
      : ""
  }`;

  const burgerBar = `block w-[26px] h-0.5 transition-all duration-300 ${light ? "bg-paper" : "bg-ink"}`;

  return (
    <header
      className={`fixed top-3.5 left-[2vw] right-[2vw] z-[100] flex items-center justify-between gap-6 px-[2.5vw] rounded-[20px] border backdrop-blur-[18px] backdrop-saturate-[1.6] transition-all duration-[400ms] ${shell}`}
    >
      <a href="#top" className="shrink-0" onClick={() => setOpen(false)}>
        <Mark size="md" tone={light ? "paper" : "ink"} />
      </a>
      <nav className={linksWrap}>
        {LINKS.map(([label, href]) => (
          <a key={href} href={href} className={linkCls} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
        <a
          href="#mela"
          className={`${linkCls} min-[861px]:hidden text-gold!`}
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            openRegister();
          }}
        >
          Register now
        </a>
        <a
          href="tel:+8801767096181"
          className={`${linkCls} min-[861px]:hidden`}
          onClick={() => setOpen(false)}
        >
          Call 01767-096181
        </a>
      </nav>
      <span
        className={`hidden min-[1081px]:inline ml-auto mr-[2vw] text-fine font-semibold tracking-[0.22em] uppercase whitespace-nowrap ${
          light ? "text-[rgba(246,245,241,0.7)]" : "text-dim"
        }`}
        aria-hidden="true"
      >
        Dhaka <b className="text-gold tabular-nums">{clock}</b>
      </span>
      <a
        className="btn hidden min-[861px]:inline-flex px-[26px] py-3 text-fine"
        href="#contact"
        onClick={(e) => {
          e.preventDefault();
          setOpen(false);
          openRegister();
        }}
      >
        Register now
      </a>
      <button
        className="flex min-[861px]:hidden flex-col gap-1.5 bg-transparent border-0 p-2"
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        <i className={`${burgerBar} ${open ? "translate-y-1 rotate-45" : ""}`} />
        <i className={`${burgerBar} ${open ? "-translate-y-1 -rotate-45" : ""}`} />
      </button>
      <i
        className="absolute left-3.5 right-3.5 bottom-0 h-0.5 rounded-sm bg-gold origin-left pointer-events-none"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  );
}
