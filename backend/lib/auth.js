import { timingSafeEqual } from "node:crypto";

/* Admin routes take `Authorization: Bearer <ADMIN_KEY>`, compared in constant time.
   With no ADMIN_KEY set at all they are open; index.js shouts about it at boot. */
export const adminOpen = () => !process.env.ADMIN_KEY;

/* wrong keys are counted per IP so the key cannot be guessed online: 20 misses → 15 minutes out */
const misses = new Map();
const WINDOW = 15 * 60_000;
const MAX_MISSES = 20;
setInterval(() => {
  const now = Date.now();
  for (const [ip, m] of misses) if (m.reset < now) misses.delete(ip);
}, WINDOW).unref();

export function requireAdmin(req, res, next) {
  if (req.user?.role === "admin") return next(); // staff signed in with their own account
  const key = process.env.ADMIN_KEY;
  if (!key) return next(); // no key configured: the ticket office is open (dev / first look)
  const now = Date.now();
  const m = misses.get(req.ip);
  if (m && m.reset > now && m.count >= MAX_MISSES) {
    return res.status(429).json({ error: "Too many wrong keys — try again in a few minutes" });
  }
  const given = (req.get("authorization") || "").replace(/^Bearer\s+/i, "").trim();
  const a = Buffer.from(given);
  const b = Buffer.from(key);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    const rec = m && m.reset > now ? m : { count: 0, reset: now + WINDOW };
    rec.count += 1;
    misses.set(req.ip, rec);
    return res.status(401).json({ error: "Invalid admin key" });
  }
  misses.delete(req.ip);
  next();
}
