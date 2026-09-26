import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { IconArrowUp } from "./icons";

/* Small shared pieces for the ticket office: routing, theme, toasts, loading / empty states. */

/* ── hash routing: #/events/:id/stats etc. Refresh keeps the place. ── */
export function parseHash(hash) {
  const parts = (hash || "").replace(/^#\/?/, "").split("/").filter(Boolean);
  const [root, a, b] = parts;
  if (!root) return { screen: "overview" };
  if (root === "events") {
    if (!a) return { screen: "events" };
    if (a === "new") return { screen: "new" };
    return { screen: "event", id: a, tab: ["stats", "registrations", "edit"].includes(b) ? b : "stats" };
  }
  if (root === "waiting") return { screen: "waiting" };
  if (root === "users") return { screen: "users" };
  if (root === "gallery") return { screen: "gallery" };
  if (root === "site") return { screen: "site" };
  return { screen: "overview" };
}

export function useHash() {
  const [hash, setHash] = useState(() => window.location.hash);
  useEffect(() => {
    const on = () => setHash(window.location.hash);
    window.addEventListener("hashchange", on);
    return () => window.removeEventListener("hashchange", on);
  }, []);
  return parseHash(hash);
}
export const go = (path) => {
  window.location.hash = path;
};

/* ── theme, remembered per browser ── */
const THEME_KEY = "archer.adminTheme";
export function useTheme() {
  const [theme, setTheme] = useState(() => {
    try {
      return localStorage.getItem(THEME_KEY) === "light" ? "light" : "dark";
    } catch {
      return "dark";
    }
  });
  const toggle = useCallback(() => {
    setTheme((t) => {
      const next = t === "dark" ? "light" : "dark";
      try {
        localStorage.setItem(THEME_KEY, next);
      } catch {
        /* private mode: the toggle still works for this visit */
      }
      return next;
    });
  }, []);
  return [theme, toggle];
}

/* ── toasts: one at a time, bottom right ── */
const ToastContext = createContext(() => {});
export const useToast = () => useContext(ToastContext);

export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null);
  const timer = useRef(null);
  const say = useCallback((message, error = false) => {
    clearTimeout(timer.current);
    setToast({ message, error, key: Date.now() });
    timer.current = setTimeout(() => setToast(null), error ? 4500 : 2500);
  }, []);
  useEffect(() => () => clearTimeout(timer.current), []);
  return (
    <ToastContext.Provider value={say}>
      {children}
      {toast && (
        <div key={toast.key} className={`toast${toast.error ? " error" : ""}`} role="status">
          {toast.message}
        </div>
      )}
    </ToastContext.Provider>
  );
}

/* ── states ── */
export const Spinner = ({ className = "py-16" }) => (
  <div className={`flex justify-center ${className}`}>
    <div className="spinner" aria-label="Loading" />
  </div>
);
export const Empty = ({ children }) => <div className="empty-state">{children}</div>;

/* ── logo mark shared by the sidebar and the login card ── */
export const LogoMark = ({ size = 28 }) => (
  <span
    className="inline-flex items-center justify-center shrink-0 text-white"
    style={{ width: size, height: size, borderRadius: Math.round(size * 0.3), background: "var(--grad)" }}
  >
    <IconArrowUp width={Math.round(size * 0.57)} height={Math.round(size * 0.57)} strokeWidth={2.25} />
  </span>
);

/* ── KPI card ── */
export const num = (n) => (typeof n === "number" ? n.toLocaleString("en-GB") : n);
export function StatCard({ icon: Icon, tint = "tint-purple", value, label, sub }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tint}`}>
        <Icon width={18} height={18} />
      </div>
      <div className="stat-value tnum">{num(value)}</div>
      <div className="stat-label">{label}</div>
      {sub && <div className="text-[12px] mt-1" style={{ color: "var(--text-dim)" }}>{sub}</div>}
    </div>
  );
}

/* ── badges ── */
export const Badge = ({ tone = "neutral", children }) => <span className={`badge badge-${tone}`}>{children}</span>;
export const STATUS_TONE = { pending: "warning", confirmed: "success", cancelled: "error" };

/* an event is over when it ended, or 12h after it started when no end was given */
export const endOf = (e) => (e.endsAt ? new Date(e.endsAt) : new Date(new Date(e.startsAt).getTime() + 12 * 3600_000)).getTime();
export const isPast = (e) => endOf(e) < Date.now();
export const hasStalls = (e) => !!e.registration?.roles?.includes("stall");

/* pretty error for the "Not found" and network cases */
export const errText = (e) => e?.message || "Something went wrong";

/* ── dialog ──
   A small centred panel for the few decisions that need a form: taking money at the
   desk, refunding it. Escape and the backdrop both mean "no". */
export function Dialog({ title, subtitle, onClose, children }) {
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.documentElement.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.documentElement.style.overflow = "";
    };
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
      <button className="absolute inset-0 border-0 cursor-default" style={{ background: "rgba(3,4,12,0.72)" }} aria-label="Close" onClick={onClose} />
      <div className="panel relative w-full max-w-[440px] fade-in">
        <h2 className="panel-title">{title}</h2>
        {subtitle && <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>{subtitle}</p>}
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}
