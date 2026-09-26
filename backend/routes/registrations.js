import { Router } from "express";
import { Form } from "../lib/validate.js";
import { makeCode } from "../lib/codes.js";
import { rateLimit } from "../lib/ratelimit.js";
import { notFound } from "../lib/http.js";
import { ROLES, isOver } from "../lib/events.js";
import { AGE_RANGES, AREAS, GENDERS, SOURCES, STALL_CATEGORIES } from "../shared/options.js";

export const registrationsRouter = Router();
export const interestRouter = Router();

const limiter = rateLimit({ windowMs: 10 * 60_000, max: Number(process.env.RATE_LIMIT_MAX) || 20 });

/* what a guest gets back: their ticket */
const ticket = (r, e) => ({
  id: String(r._id), // the checkout needs it
  code: r.code,
  role: r.role,
  status: r.status,
  name: r.name,
  guests: r.guests,
  business: r.business,
  event: { slug: e.slug, title: e.title, kind: e.kind, startsAt: e.startsAt, endsAt: e.endsAt, venue: e.venue, city: e.city },
});

registrationsRouter.post("/", limiter, async (req, res) => {
  const store = req.app.locals.store;
  const f = new Form(req.body)
    .text("event", { required: true, max: 80 })
    .oneOf("role", ROLES, { fallback: "visitor" })
    .text("name", { required: true, min: 2, max: 80 })
    .phone("phone")
    .email("email")
    .text("business", { max: 80 })
    .int("guests", { min: 1, max: 10, fallback: 1 })
    .oneOf("age", AGE_RANGES)
    .oneOf("gender", GENDERS)
    .oneOf("area", AREAS)
    .oneOf("source", SOURCES)
    .oneOf("category", STALL_CATEGORIES)
    .text("note", { max: 500 });

  const event = f.data.event ? await store.events.get(f.data.event) : null;
  if (!event || !event.published) f.errors.event = "Pick an event";
  else if (!event.registration.open) f.errors.event = "Registration is closed for this event";
  else if (isOver(event)) f.errors.event = "This event has already happened";
  else if (!event.registration.roles.includes(f.data.role)) f.errors.role = "Not available for this event";
  if (event && f.data.role === "stall" && !f.data.business) f.errors.business = "Tell us your store or brand name";
  if (event && f.data.role === "stall" && !f.data.category) f.errors.category = "Pick what you sell";
  if (f.data.role === "stall") delete f.errors.guests; // party size is a visitor question
  if (event && f.data.role === "visitor" && !f.data.age) f.errors.age = "Pick an age range";
  const data = f.done();

  const key = { eventId: String(event._id), phone: data.phone, role: data.role };
  const dup = await store.registrations.findDuplicate(key);
  if (dup) return res.json({ registration: ticket(dup, event), duplicate: true });

  const doc = {
    ...key,
    eventSlug: event.slug,
    code: makeCode(),
    name: data.name,
    email: data.email,
    business: data.role === "stall" ? data.business : "",
    guests: data.role === "visitor" ? data.guests : 0,
    age: data.age || "",
    gender: data.gender || "",
    area: data.area || "",
    source: data.source || "",
    category: data.role === "stall" ? data.category || "" : "",
    note: data.note,
    status: "pending",
    userId: req.user ? String(req.user._id) : null,
    via: "web",
    ip: req.ip,
    createdAt: new Date(),
  };

  let saved;
  try {
    saved = await store.registrations.create(doc);
  } catch (err) {
    if (err.code !== 11000) throw err;
    // unique-index race: either the same person double-submitted, or the code collided
    const again = await store.registrations.findDuplicate(key);
    if (again) return res.json({ registration: ticket(again, event), duplicate: true });
    saved = await store.registrations.create({ ...doc, code: makeCode() });
  }
  res.status(201).json({ registration: ticket(saved, event) });
});

/* look a ticket up by its code */
registrationsRouter.get("/:code", async (req, res) => {
  const store = req.app.locals.store;
  const r = await store.registrations.byCode(String(req.params.code).toUpperCase());
  if (!r) throw notFound("No ticket with that code");
  const e = await store.events.get(r.eventId);
  res.json({ registration: ticket(r, e) });
});

/* "tell me about the next one" — when nothing is on the calendar */
interestRouter.post("/", limiter, async (req, res) => {
  const store = req.app.locals.store;
  const data = new Form(req.body)
    .text("name", { required: true, min: 2, max: 80 })
    .phone("phone")
    .email("email")
    .text("note", { max: 300 })
    .done();
  const { created } = await store.interest.upsert({ ...data, via: "web", ip: req.ip, createdAt: new Date() });
  res.status(created ? 201 : 200).json({ ok: true, created });
});
