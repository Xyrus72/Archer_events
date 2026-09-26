import { useState } from "react";
import { LogoMark } from "./ui";
import { IconBell, IconCalendar, IconExternal, IconGlobe, IconHome, IconImage, IconLogout, IconMenu, IconMoon, IconSun, IconUsers, IconX } from "./icons";

/* The ticket-office frame: fixed sidebar (a drawer below lg), sticky topbar, ambient grid + glow. */

const NAV = [
  { href: "#/", label: "Overview", icon: IconHome, match: (s) => s === "overview" },
  { href: "#/events", label: "Events", icon: IconCalendar, match: (s) => s === "events" || s === "event" || s === "new" },
  { href: "#/users", label: "Users", icon: IconUsers, match: (s) => s === "users" },
  { href: "#/waiting", label: "Waiting list", icon: IconBell, match: (s) => s === "waiting" },
  { href: "#/gallery", label: "Moments", icon: IconImage, match: (s) => s === "gallery" },
  { href: "#/site", label: "Site", icon: IconGlobe, match: (s) => s === "site" },
];

export const SCREEN_TITLE = { overview: "Overview", events: "Events", new: "New event", event: "Event", users: "Users", gallery: "Moments", waiting: "Waiting list", site: "Site" };

export default function Shell({ route, theme, onToggleTheme, me, onSignOut, title, children }) {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <div className="relative min-h-svh">
      {open && <button className="fixed inset-0 z-30 lg:hidden" style={{ background: "rgba(0,0,0,0.55)" }} aria-label="Close menu" onClick={close} />}

      <aside className={`side${open ? " open" : ""}`}>
        <div className="side-head">
          <LogoMark />
          <div className="min-w-0 leading-tight">
            <div className="text-[15px] font-bold" style={{ color: "var(--text)" }}>Archer</div>
            <div className="text-[11px]" style={{ color: "var(--text-muted)" }}>Ticket office</div>
          </div>
          <button className="ml-auto lg:hidden p-1 rounded-md" style={{ color: "var(--text-muted)" }} aria-label="Close menu" onClick={close}>
            <IconX />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-4 pl-[22px]">
          {NAV.map(({ href, label, icon: Icon, match }) => (
            <a key={href} href={href} onClick={close} className={`side-link${match(route.screen) ? " active" : ""}`}>
              <Icon />
              <span>{label}</span>
            </a>
          ))}
        </nav>

        <div className="mt-auto p-4 flex flex-col gap-2" style={{ borderTop: "1px solid var(--border)" }}>
          <button className="side-link" onClick={onToggleTheme}>
            {theme === "dark" ? <IconSun /> : <IconMoon />}
            <span>{theme === "dark" ? "Light theme" : "Dark theme"}</span>
          </button>
          {me?.user && (
            <div className="px-3 py-2">
              <span className="block text-[13px] font-semibold truncate" style={{ color: "var(--text)" }}>{me.user.name}</span>
              <span className="text-[11px]" style={{ color: "var(--violet-ink)" }}>Staff account</span>
            </div>
          )}
          {me?.open && !me?.user ? (
            <div className="px-3 py-2 flex flex-col gap-1.5">
              <span className="badge badge-error w-fit">Open access</span>
              <span className="text-[11px]" style={{ color: "var(--text-dim)" }}>set ADMIN_KEY to lock</span>
            </div>
          ) : (
            <button className="side-link" onClick={onSignOut}>
              <IconLogout />
              <span>Sign out</span>
            </button>
          )}
        </div>
      </aside>

      <div className="relative min-h-svh lg:ml-[256px]">
        <header className="topbar">
          <button className="lg:hidden p-1.5 -ml-1.5 rounded-md" style={{ color: "var(--text-muted)" }} aria-label="Open menu" onClick={() => setOpen(true)}>
            <IconMenu />
          </button>
          <span className="text-[14px] font-semibold truncate" style={{ color: "var(--text)" }}>{title}</span>
          <div className="ml-auto flex items-center gap-2.5">
            {me && <span className={`badge ${me.store === "mongo" ? "badge-cyan" : "badge-warning"}`}>{me.store === "mongo" ? "MongoDB" : "In-memory"}</span>}
            <a className="btn-ghost btn-sm" href="/" target="_blank" rel="noreferrer">
              <IconExternal width={14} height={14} /> View site
            </a>
          </div>
        </header>

        <div className="relative overflow-hidden">
          <div className="bg-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
          <div className="glow-purple absolute pointer-events-none" style={{ width: 640, height: 640, top: -220, right: -160, filter: "blur(40px)" }} aria-hidden="true" />
          <div className="relative page-root max-w-[1400px]">{children}</div>
        </div>
      </div>
    </div>
  );
}
