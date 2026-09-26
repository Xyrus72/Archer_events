import { useEffect, useState } from "react";
import { api } from "./api";

/* Who is signed in. The session is an HttpOnly cookie, so the client never holds
   a token — it just asks the server once and shares the answer with every screen. */

let cached; // undefined = not asked yet, null = signed out
let inflight = null;
const listeners = new Set();

const publish = (user) => {
  cached = user;
  listeners.forEach((fn) => fn(user));
};

export function getUser(force = false) {
  if (!force && cached !== undefined) return Promise.resolve(cached);
  if (!inflight || force) {
    inflight = api
      .get("/api/auth/me")
      .then((d) => d.user || null)
      .catch(() => null)
      .then((u) => {
        inflight = null;
        publish(u);
        return u;
      });
  }
  return inflight;
}

export function useUser() {
  const [user, setUser] = useState(cached);
  useEffect(() => {
    listeners.add(setUser);
    getUser();
    return () => listeners.delete(setUser);
  }, []);
  return { user: user || null, loading: user === undefined };
}

const withUser = (p) => p.then((d) => (publish(d.user), d.user));

export const login = (body) => withUser(api.post("/api/auth/login", body));
export const register = (body) => withUser(api.post("/api/auth/register", body));
export const updateMe = (body) => withUser(api.patch("/api/auth/me", body));
export const changePassword = (body) => api.post("/api/auth/password", body);
/* every open tab hears about a sign-out, and a page restored from the back/forward cache
   re-asks the server instead of showing the old account */
const channel = typeof BroadcastChannel !== "undefined" ? new BroadcastChannel("archer-auth") : null;
channel?.addEventListener("message", (e) => e.data === "logout" && publish(null));
if (typeof window !== "undefined") {
  window.addEventListener("pageshow", (e) => e.persisted && getUser(true));
}

export const logout = () =>
  api
    .post("/api/auth/logout", {})
    .catch(() => {}) // the cookie is cleared or already dead either way; never leave the UI signed in
    .then(() => {
      publish(null);
      channel?.postMessage("logout");
    });

export const myRegistrations = () => api.get("/api/me/registrations").then((d) => d.registrations);
export const cancelTicket = (id) =>
  api.patch(`/api/me/registrations/${id}`, { status: "cancelled" }).then((d) => d.registration);

export const firstName = (user) => (user?.name || "").trim().split(/\s+/)[0] || "";
export const ROLE_NAME = { visitor: "Visitor", stall: "Stall vendor", admin: "Staff" };

/* only ever follow a same-origin path out of ?next= */
export function safeNext(raw, fallback = "/account") {
  return typeof raw === "string" && raw.startsWith("/") && !raw.startsWith("//") ? raw : fallback;
}
