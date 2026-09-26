import { useCallback, useEffect, useState } from "react";
import "../styles/admin.css";
import { adm, KEY } from "../lib/admin";
import { api } from "../lib/api";
import { logout } from "../lib/auth";
import Shell, { SCREEN_TITLE } from "./admin/Shell";
import Overview from "./admin/Overview";
import Events from "./admin/Events";
import EventDetail from "./admin/EventDetail";
import Editor from "./admin/Editor";
import Waiting from "./admin/Waiting";
import Site from "./admin/Site";
import Gallery from "./admin/Gallery";
import Users from "./admin/Users";
import { go, LogoMark, Spinner, ToastProvider, useHash, useTheme, useToast } from "./admin/ui";
import PasswordInput from "./PasswordInput";

/* /admin — the ticket office, in FlexTag's clothes. The key lives in sessionStorage for the tab's lifetime. */

export default function Admin() {
  const [theme, toggleTheme] = useTheme();
  const [key, setKey] = useState(() => sessionStorage.getItem(KEY) || "");
  const [me, setMe] = useState(null);
  const [checking, setChecking] = useState(true);
  const [loginError, setLoginError] = useState("");
  const [tick, setTick] = useState(0); // bumped after a staff-account sign-in so /me is read again

  useEffect(() => {
    document.title = "Ticket office — Archer Events";
  }, []);
  // no key needed while the server runs open; otherwise the key in this tab is checked
  useEffect(() => {
    let on = true;
    adm.get("/me")
      .then((d) => on && setMe(d))
      .catch((e) => {
        if (!on) return;
        setMe(null);
        if (key) setLoginError(e.status === 401 ? "That key is not right." : e.message);
      })
      .finally(() => on && setChecking(false));
    return () => {
      on = false;
    };
  }, [key, tick]);

  const signIn = (k) => {
    sessionStorage.setItem(KEY, k);
    setLoginError("");
    setChecking(true);
    setKey(k);
  };
  // signed out in another tab: drop the office here too (a key-only session stays)
  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") return;
    const ch = new BroadcastChannel("archer-auth");
    ch.onmessage = (e) => {
      if (e.data === "logout" && !sessionStorage.getItem(KEY)) setMe(null);
    };
    return () => ch.close();
  }, []);

  // wait for the server to drop the session before re-rendering, or the /me re-check
  // would still see the old cookie and sign staff straight back in
  const signOut = async () => {
    sessionStorage.removeItem(KEY);
    await logout();
    // back to the site's own sign-in, not the staff key screen
    window.location.assign("/login");
  };
  // a staff account signs in with a cookie; re-reading /me picks it up
  const recheck = () => {
    setLoginError("");
    setChecking(true);
    setTick((t) => t + 1);
  };

  return (
    <div className="fx" data-theme={theme}>
      <ToastProvider>
        {checking && !me ? (
          <Spinner className="min-h-svh items-center" />
        ) : me ? (
          <Office me={me} theme={theme} onToggleTheme={toggleTheme} onSignOut={signOut} />
        ) : (
          <Login onSubmit={signIn} onAccount={recheck} error={loginError} />
        )}
      </ToastProvider>
    </div>
  );
}

function Login({ onSubmit, onAccount, error }) {
  const [accErr, setAccErr] = useState("");
  const [busy, setBusy] = useState(false);
  const submit = (e) => {
    e.preventDefault();
    onSubmit(String(new FormData(e.target).get("key") || "").trim());
  };
  const submitAccount = async (e) => {
    e.preventDefault();
    const fd = new FormData(e.target);
    setBusy(true);
    setAccErr("");
    try {
      const d = await api.post("/api/auth/login", { phone: fd.get("phone"), password: fd.get("password") });
      if (d.user.role !== "admin") {
        await api.post("/api/auth/logout", {});
        setAccErr("That account is not staff.");
        return;
      }
      onAccount();
    } catch (err) {
      // a per-field complaint (a malformed number) is more use than the generic line
      setAccErr(err.details?.phone || err.details?.password || err.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="relative min-h-svh flex items-center justify-center p-6 overflow-hidden">
      <div className="bg-grid absolute inset-0 pointer-events-none" aria-hidden="true" />
      <div className="glow-purple absolute pointer-events-none" style={{ width: 720, height: 720, top: "-30%", left: "50%", transform: "translateX(-50%)", filter: "blur(40px)" }} aria-hidden="true" />
      <div className="panel relative w-full max-w-[420px] fade-in">
        <LogoMark size={40} />
        <h1 className="page-title mt-5">Ticket office</h1>
        <p className="page-subtitle">Staff only. Use the key below if no one has made you an account yet.</p>
        <p className="page-subtitle">Sign in with your staff account.</p>
        <form onSubmit={submitAccount} className="mt-6">
          <label className="field-label" htmlFor="adm-phone">Phone</label>
          <input id="adm-phone" name="phone" type="tel" className="field-input" placeholder="01XXXXXXXXX" autoFocus autoComplete="tel" />
          <label className="field-label mt-4" htmlFor="adm-pass">Password</label>
          <PasswordInput id="adm-pass" name="password" className="field-input" autoComplete="current-password" aria-invalid={accErr ? "true" : undefined} />
          {accErr && <p className="field-error">{accErr}</p>}
          <button type="submit" className="btn-primary w-full mt-5" disabled={busy}>{busy ? "Checking" : "Sign in"}</button>
        </form>
        <div className="flex items-center gap-3 my-5" style={{ color: "var(--text-dim)" }}>
          <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
          <span className="text-[11px] uppercase tracking-wider">or use the key</span>
          <span className="flex-1 h-px" style={{ background: "var(--border)" }} />
        </div>
        <form onSubmit={submit}>
          <label className="field-label" htmlFor="adm-key">Admin key from <code>.env</code></label>
          <PasswordInput id="adm-key" name="key" className="field-input" autoComplete="off" aria-invalid={error ? "true" : undefined} />
          {error && <p className="field-error">{error}</p>}
          <button type="submit" className="btn-ghost w-full mt-4">Enter with key</button>
        </form>
      </div>
    </div>
  );
}

/* everything behind the door: the calendar is loaded once and shared, screens refetch their own detail */
function Office({ me, theme, onToggleTheme, onSignOut }) {
  const route = useHash();
  const say = useToast();
  const [events, setEvents] = useState(null);

  const refresh = useCallback(
    () => adm.get("/events").then((d) => setEvents(d.events)).catch((e) => say(e.message, true)),
    [say],
  );
  useEffect(() => {
    refresh();
  }, [refresh]);

  const title = route.screen === "event" ? events?.find((e) => e.id === route.id)?.title || "Event" : SCREEN_TITLE[route.screen];

  return (
    <Shell route={route} theme={theme} onToggleTheme={onToggleTheme} me={me} onSignOut={onSignOut} title={title}>
      {route.screen === "overview" && <Overview events={events} />}
      {route.screen === "events" && <Events events={events} />}
      {route.screen === "new" && (
        <div className="fade-in">
          <header className="page-header">
            <div className="page-label"><span>Event</span></div>
            <h1 className="page-title">New event</h1>
            <p className="page-subtitle">It goes on the homepage as soon as it is published.</p>
          </header>
          <Editor onSaved={async (e) => { await refresh(); go(`#/events/${e.id}/stats`); }} onCancel={() => go("#/events")} />
        </div>
      )}
      {route.screen === "event" && <EventDetail key={route.id} events={events} id={route.id} tab={route.tab} onChange={refresh} />}
      {route.screen === "users" && <Users me={me} />}
      {route.screen === "waiting" && <Waiting />}
      {route.screen === "gallery" && <Gallery />}
      {route.screen === "site" && <Site />}
    </Shell>
  );
}
