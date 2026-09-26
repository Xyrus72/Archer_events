import { Router } from "express";
import { notFound, serialize } from "../lib/http.js";
import { isLive, isOver } from "../lib/events.js";

export const eventsRouter = Router();

/* what the site needs to know about an event */
export const publicEvent = (e, now = Date.now()) => ({
  ...serialize(e),
  pricing: { visitor: e.pricing?.visitor || 0, stall: e.pricing?.stall || 0 },
  live: isLive(e, now),
  over: isOver(e, now),
});

/* upcoming (incl. live) and a few recent past events */
eventsRouter.get("/", async (req, res) => {
  const now = Date.now();
  const all = await req.app.locals.store.events.list({ publishedOnly: true });
  const upcoming = all.filter((e) => !isOver(e, now)).map((e) => publicEvent(e, now));
  const past = all
    .filter((e) => isOver(e, now))
    .sort((a, b) => b.startsAt - a.startsAt)
    .slice(0, 4)
    .map((e) => publicEvent(e, now));
  res.json({ upcoming, past, now: new Date(now).toISOString() });
});

eventsRouter.get("/:slug", async (req, res) => {
  const e = await req.app.locals.store.events.get(req.params.slug);
  if (!e || !e.published) throw notFound("No such event");
  res.json({ event: publicEvent(e) });
});
