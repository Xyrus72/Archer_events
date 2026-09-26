/* Fixed-window limiter per IP, in memory — plenty for a registration form. */
export function rateLimit({ windowMs = 10 * 60_000, max = 30 } = {}) {
  const hits = new Map();
  setInterval(() => {
    const now = Date.now();
    for (const [ip, h] of hits) if (h.reset < now) hits.delete(ip);
  }, windowMs).unref();

  return (req, res, next) => {
    const now = Date.now();
    const h = hits.get(req.ip) || { count: 0, reset: now + windowMs };
    if (h.reset < now) {
      h.count = 0;
      h.reset = now + windowMs;
    }
    h.count += 1;
    hits.set(req.ip, h);
    res.setHeader("X-RateLimit-Remaining", String(Math.max(0, max - h.count)));
    if (h.count > max) {
      return res.status(429).json({ error: "Too many requests — try again in a few minutes" });
    }
    next();
  };
}
