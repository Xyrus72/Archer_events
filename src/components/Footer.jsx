import Mark from "./Mark";

const linkCls = "text-fine tracking-[0.18em] uppercase text-paper-dim transition-colors hover:text-paper";

export default function Footer() {
  return (
    <footer className="relative z-[1] bg-dark text-paper border-t border-linel px-[6vw] py-[27.5px]">
      <div className="max-w-[1560px] mx-auto flex flex-wrap items-center justify-between gap-x-[27.5px] gap-y-[17px]">
        <a href="#top" aria-label="Back to top">
          <Mark size="sm" tone="paper" />
        </a>
        <nav className="flex flex-wrap gap-[17px]">
          <a className={linkCls} href="#services">What we do</a>
          <a className={linkCls} href="#work">Work</a>
          <a className={linkCls} href="#mela">Offline Mela</a>
          <a className={linkCls} href="https://www.facebook.com/profile.php?id=61592698905669" target="_blank" rel="noreferrer">Facebook</a>
        </nav>
        <div className="flex flex-wrap gap-[17px]">
          <a className={linkCls} href="tel:+8801767096181">01767-096181</a>
          <a className={linkCls} href="mailto:archerevents.management@gmail.com">archerevents.management@gmail.com</a>
        </div>
        <p className="text-fine tracking-[0.22em] uppercase text-[rgba(246,245,241,0.35)] w-full text-center min-[1281px]:w-auto min-[1281px]:text-right">
          © {new Date().getFullYear()} Archer Events — Dhanmondi, Dhaka
        </p>
      </div>
    </footer>
  );
}
