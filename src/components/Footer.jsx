import { Seal } from "./Logo";
import { Stripes } from "./Ornaments";

const linkCls =
  "font-label text-[12px] font-medium tracking-[0.24em] uppercase text-cream/60 transition-colors hover:text-mustard";

export default function Footer() {
  return (
    <footer className="relative z-[1] bg-ink text-cream">
      <Stripes />
      <div className="px-[6vw] py-[34px]">
        <div className="max-w-[1560px] mx-auto flex flex-wrap items-center justify-between gap-x-[27.5px] gap-y-[17px]">
          <a href="#top" aria-label="Back to top" className="shrink-0">
            <Seal className="w-[76px] h-[76px]" />
          </a>
          <nav className="flex flex-wrap gap-[17px]">
            <a className={linkCls} href="#services">What we do</a>
            <a className={linkCls} href="#work">Work</a>
            <a className={linkCls} href="#next">Next event</a>
            <a className={linkCls} href="/login">Sign in</a>
            <a className={linkCls} href="https://www.facebook.com/profile.php?id=61592698905669" target="_blank" rel="noreferrer">Facebook</a>
          </nav>
          <div className="flex flex-wrap gap-[17px]">
            <a className={linkCls} href="tel:+8801767096181">01767-096181</a>
            <a className={`${linkCls} normal-case tracking-[0.08em]`} href="mailto:archerevents.management@gmail.com">archerevents.management@gmail.com</a>
          </div>
          <p className="font-label text-[11.5px] tracking-[0.22em] uppercase text-cream/40 w-full text-center min-[1281px]:w-auto min-[1281px]:text-right">
            &copy; {new Date().getFullYear()} Archer Events, Dhanmondi, Dhaka &middot; Owned &amp; operated by FEZA Ltd.
          </p>
        </div>
      </div>
    </footer>
  );
}
