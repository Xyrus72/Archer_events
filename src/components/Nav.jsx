import { useEffect, useState } from "react";
import { Crest } from "./Logo";
import { firstName, useUser } from "../lib/auth";
import { openRegister } from "./RegisterModal";

const LINKS = [
  ["What we do", "#services"],
  ["Work", "#work"],
  ["Next Event", "#next"],
  ["Contact", "#contact"],
];

/* away from the home page the anchors need to travel there first */
const onHome = window.location.pathname.replace(/\/+$/, "") === "";
const to = (href) => (onHome ? href : `/${href}`);

export default function Nav() {
  const { user } = useUser();
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

  // the sheet is cream everywhere now, so the masthead reads dark from the first pixel;
  // scrolling only tightens it and adds the second rule
  const light = false;

  const shell = solid
    ? "nav-rule bg-cream border-b-2 border-ink py-2 shadow-[0_18px_40px_rgba(42,29,18,0.1)]"
    : "bg-cream/92 backdrop-blur-[6px] border-b-2 border-ink/25 py-3";

  const linkCls = `relative py-1.5 font-label text-[13px] font-medium tracking-[0.24em] uppercase transition-colors ${
    light ? "text-cream/80 hover:text-cream" : "text-ink/70 hover:text-ink"
  } after:content-[''] after:absolute after:left-0 after:bottom-0 after:w-full after:h-0.5 after:bg-rust after:origin-left after:scale-x-0 after:transition-transform after:duration-300 hover:after:scale-x-100 ${
    open ? "max-[860px]:py-3.5 max-[860px]:text-[15px]" : ""
  }`;

  const linksWrap = `gap-[3vw] hidden min-[861px]:flex ${
    open
      ? "max-[860px]:flex max-[860px]:absolute max-[860px]:top-[calc(100%+10px)] max-[860px]:left-[2vw] max-[860px]:right-[2vw] max-[860px]:flex-col max-[860px]:gap-0 max-[860px]:bg-cream max-[860px]:border-2 max-[860px]:border-ink max-[860px]:shadow-[0_16px_44px_rgba(27,24,21,0.18)] max-[860px]:px-6 max-[860px]:pt-3 max-[860px]:pb-5"
      : ""
  }`;

  const burgerBar = `block w-[26px] h-0.5 transition-all duration-300 ${light ? "bg-cream" : "bg-ink"}`;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-[100] flex items-center justify-between gap-6 px-[4vw] transition-all duration-[400ms] ${shell}`}
    >
      <a href={onHome ? "#top" : "/"} className="shrink-0" onClick={() => setOpen(false)} aria-label="Archer Events, home">
        <Crest className="h-[54px] w-auto" />
      </a>
      <nav className={linksWrap}>
        {LINKS.map(([label, href]) => (
          <a key={href} href={to(href)} className={linkCls} onClick={() => setOpen(false)}>
            {label}
          </a>
        ))}
        <a
          href="#next"
          className={`${linkCls} min-[861px]:hidden text-rust!`}
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            openRegister();
          }}
        >
          Register now
        </a>
        <a href={user ? "/account" : "/login"} className={`${linkCls} min-[861px]:hidden`} onClick={() => setOpen(false)}>
          {user ? `My tickets · ${firstName(user)}` : "Sign in"}
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
        className={`hidden min-[1081px]:inline ml-auto mr-[2vw] font-label text-[13px] font-medium tracking-[0.24em] uppercase whitespace-nowrap ${
          light ? "text-cream/70" : "text-ink/60"
        }`}
        aria-hidden="true"
      >
        Dhaka <b className={`tabular-nums font-semibold ${light ? "text-mustard" : "text-rust"}`}>{clock}</b>
      </span>
      {/* the pair the visitor acts on: sign in sits beside register */}
      <div className="hidden min-[861px]:flex items-center gap-3">
        <a
          className={`btn ghost px-[22px] py-[13px] text-[12px] ${light ? "on-hero" : ""}`}
          href={user ? "/account" : "/login"}
        >
          {user ? `My tickets · ${firstName(user)}` : "Sign in"}
        </a>
        <a
          className="btn px-[24px] py-[13px] text-[12px]"
          href="#contact"
          onClick={(e) => {
            e.preventDefault();
            setOpen(false);
            openRegister();
          }}
        >
          Register now
        </a>
      </div>
      <button
        className="flex min-[861px]:hidden flex-col gap-1.5 bg-transparent border-0 p-2"
        aria-label="Menu"
        onClick={() => setOpen((v) => !v)}
      >
        <i className={`${burgerBar} ${open ? "translate-y-1 rotate-45" : ""}`} />
        <i className={`${burgerBar} ${open ? "-translate-y-1 -rotate-45" : ""}`} />
      </button>
      <i
        className="absolute left-0 right-0 -bottom-0.5 h-0.5 bg-rust origin-left pointer-events-none"
        style={{ transform: `scaleX(${progress})` }}
      />
    </header>
  );
}
