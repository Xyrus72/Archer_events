import { useEffect, useState } from "react";

/* Tiny fetch wrapper. Errors carry .status and .details (per-field messages from the API). */
async function parse(res) {
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw Object.assign(new Error(data.error || `Request failed (${res.status})`), {
      status: res.status,
      details: data.details || {},
    });
  }
  return data;
}

const send = (method, url, body, extra) =>
  fetch(url, {
    method,
    headers: { Accept: "application/json", ...(body ? { "Content-Type": "application/json" } : {}), ...extra },
    body: body ? JSON.stringify(body) : undefined,
  }).then(parse);

export const api = {
  get: (url, extra) => send("GET", url, null, extra),
  post: (url, body, extra) => send("POST", url, body, extra),
  patch: (url, body, extra) => send("PATCH", url, body, extra),
  put: (url, body, extra) => send("PUT", url, body, extra),
  del: (url, extra) => send("DELETE", url, null, extra),
};

/* the calendar is fetched once and shared by the ticket card and the register modal */
let eventsPromise = null;
export function loadEvents(force = false) {
  if (!eventsPromise || force) {
    eventsPromise = api.get("/api/events").catch((err) => {
      eventsPromise = null;
      throw err;
    });
  }
  return eventsPromise;
}

export function useEvents() {
  const [state, setState] = useState({ upcoming: [], past: [], loading: true, error: null });
  useEffect(() => {
    let on = true;
    loadEvents()
      .then((d) => on && setState({ upcoming: d.upcoming, past: d.past, loading: false, error: null }))
      .catch((error) => on && setState({ upcoming: [], past: [], loading: false, error }));
    return () => {
      on = false;
    };
  }, []);
  return state;
}

/* the hero stats are counted live by the API; until they arrive (or if it is down)
   the strip stays empty rather than showing numbers that were never true */
export const SITE_DEFAULTS = { heroStats: [] };

let settingsPromise = null;
export function loadSettings(force = false) {
  if (!settingsPromise || force) {
    settingsPromise = api
      .get("/api/settings")
      .then((d) => {
        /* never trust the shape: a bad heroStats must not take the whole homepage down */
        const hs = d?.settings?.heroStats;
        const ok = Array.isArray(hs)
          ? hs.filter((x) => x && typeof x.value === "string" && typeof x.label === "string")
          : [];
        return { ...SITE_DEFAULTS, heroStats: ok.length ? ok : SITE_DEFAULTS.heroStats };
      })
      .catch(() => {
        settingsPromise = null; // so the next caller retries instead of pinning the defaults
        return SITE_DEFAULTS;
      });
  }
  return settingsPromise;
}

export function useSettings() {
  const [settings, setSettings] = useState(SITE_DEFAULTS);
  useEffect(() => {
    let on = true;
    loadSettings().then((s) => on && setSettings(s));
    return () => {
      on = false;
    };
  }, []);
  return settings;
}

export const ROLE_LABEL = { visitor: "Visitor", stall: "Stall vendor" };
export const KIND_LABEL = {
  festival: "Festival / Mela",
  concert: "Concert",
  corporate: "Corporate",
  wedding: "Wedding",
  activation: "Brand activation",
  themed: "Themed night",
  other: "Event",
};

/* everything is shown in Dhaka time, whatever the visitor's clock says */
const dhaka = (opts) => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", ...opts });
export const fmtDate = (iso) => dhaka({ day: "numeric", month: "short", year: "numeric" }).format(new Date(iso));
export const fmtDay = (iso) => dhaka({ day: "numeric", month: "short" }).format(new Date(iso));
export const fmtTime = (iso) => dhaka({ hour: "numeric", minute: "2-digit", hour12: true }).format(new Date(iso));
export const fmtWhen = (e) =>
  `${fmtDate(e.startsAt)} · ${fmtTime(e.startsAt)}${e.endsAt ? ` – ${fmtTime(e.endsAt)}` : ""}`;
export const fmtWhere = (e) => [e.venue, e.city].filter(Boolean).join(", ");

/* WhatsApp deep link to the office, with a prefilled message */
export const WA = "8801767096181";
export const waLink = (text) => `https://wa.me/${WA}?text=${encodeURIComponent(text)}`;
