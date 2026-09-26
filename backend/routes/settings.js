import { Router } from "express";

export const settingsRouter = Router();

/* The hero numbers are counted from the database, never typed in: published events,
   the people registered for them (visitors, their guests and stalls, cancellations
   excluded) and the cities those events ran in. */
export async function liveStats(store) {
  const events = await store.events.list({ publishedOnly: true });
  const regs = (await store.registrations.list({ limit: 0 })).filter((r) => r.status !== "cancelled");
  const guests = regs.reduce((n, r) => n + 1 + (r.role === "visitor" ? Number(r.guests) || 0 : 0), 0);
  const cities = new Set(events.map((e) => String(e.city || "").trim().toLowerCase()).filter(Boolean));
  const fmt = (n) => n.toLocaleString("en-US");
  return [
    { value: fmt(events.length), label: events.length === 1 ? "event" : "events" },
    { value: fmt(guests), label: guests === 1 ? "guest" : "guests" },
    { value: fmt(cities.size), label: cities.size === 1 ? "city" : "cities" },
  ];
}

settingsRouter.get("/", async (req, res) => {
  res.json({ settings: { heroStats: await liveStats(req.app.locals.store) } });
});
