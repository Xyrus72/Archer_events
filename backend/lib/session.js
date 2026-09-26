import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

/* Passwords and sessions with nothing but node:crypto — scrypt for storage,
   a signed cookie for the session, so there is no library to keep patched. */

const N = 16384;
const b64 = (buf) => Buffer.from(buf).toString("base64url");
const eq = (a, b) => {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
};

export function hashPassword(password) {
  const salt = randomBytes(16);
  const hash = scryptSync(password, salt, 64, { N, r: 8, p: 1 });
  return `scrypt$${N}$${b64(salt)}$${b64(hash)}`;
}

/* a fixed dummy so a login for an unknown phone costs the same as a real one */
const DUMMY = hashPassword("archer-dummy-password");

export function verifyPassword(password, stored) {
  const [scheme, n, salt, hash] = String(stored || DUMMY).split("$");
  if (scheme !== "scrypt") return false;
  const got = scryptSync(password, Buffer.from(salt, "base64url"), 64, { N: Number(n) || N, r: 8, p: 1 });
  return eq(got, Buffer.from(hash, "base64url"));
}

/* Session secret: from the environment in production, random per boot otherwise
   (which simply means everyone is signed out again after a restart). */
const SECRET =
  process.env.SESSION_SECRET ||
  (() => {
    console.warn("[auth] SESSION_SECRET is not set — sessions reset on every restart.");
    return randomBytes(32).toString("hex");
  })();

const DAYS_30 = 30 * 24 * 3600;
const sign = (payload) => createHmac("sha256", SECRET).update(payload).digest("base64url");

export function makeToken(user) {
  const payload = b64(JSON.stringify({ uid: String(user._id), role: user.role, sv: user.sessionVersion || 0, exp: Math.floor(Date.now() / 1000) + DAYS_30 }));
  return `${payload}.${sign(payload)}`;
}

export function readToken(token) {
  const [payload, mac] = String(token || "").split(".");
  if (!payload || !mac || !eq(mac, sign(payload))) return null;
  try {
    const claims = JSON.parse(Buffer.from(payload, "base64url").toString());
    return claims.exp > Date.now() / 1000 ? claims : null;
  } catch {
    return null;
  }
}

export const COOKIE = "archer_session";

const cookieBits = (req) => {
  const https = req.secure || req.get("x-forwarded-proto") === "https";
  return `Path=/; HttpOnly; SameSite=Lax${https ? "; Secure" : ""}`;
};

export const setSessionCookie = (req, res, user) =>
  res.setHeader("Set-Cookie", `${COOKIE}=${makeToken(user)}; Max-Age=${DAYS_30}; ${cookieBits(req)}`);

export const clearSessionCookie = (req, res) =>
  res.setHeader("Set-Cookie", `${COOKIE}=; Max-Age=0; ${cookieBits(req)}`);

/* hand-rolled cookie read — one name, no parser dependency */
function readCookie(header, name) {
  for (const part of String(header || "").split(";")) {
    const i = part.indexOf("=");
    if (i > 0 && part.slice(0, i).trim() === name) return decodeURIComponent(part.slice(i + 1).trim());
  }
  return "";
}

/* Puts req.user on every request (or null). A bad or expired token is simply ignored. */
export const attachUser = (store) => async (req, res, next) => {
  req.user = null;
  const claims = readToken(readCookie(req.get("cookie"), COOKIE));
  if (claims) {
    const user = await store.users.get(claims.uid).catch(() => null);
    // signing out bumps sessionVersion, which kills every cookie issued before it
    if (user && (user.sessionVersion || 0) === (claims.sv || 0)) req.user = user;
  }
  next();
};

export const publicUser = (u) =>
  u && {
    id: String(u._id),
    role: u.role,
    name: u.name,
    phone: u.phone,
    email: u.email || "",
    business: u.business || "",
    createdAt: u.createdAt,
  };

export const requireUser = (req, res, next) =>
  req.user ? next() : res.status(401).json({ error: "Sign in first" });

/* SameSite=Lax already blocks cross-site form posts; requiring JSON closes the rest */
export const jsonOnly = (req, res, next) =>
  req.method === "GET" || (req.get("content-type") || "").includes("application/json")
    ? next()
    : res.status(415).json({ error: "Send JSON" });
