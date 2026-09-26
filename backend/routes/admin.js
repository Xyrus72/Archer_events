import { Router } from "express";
import { adminOpen, requireAdmin } from "../lib/auth.js";
import { publicUser } from "../lib/session.js";
import { Form, slugify } from "../lib/validate.js";
import { HttpError, notFound, serialize } from "../lib/http.js";
import { EVENT_KINDS, ROLES, rolesFor } from "../lib/events.js";
import { computeOverview, computeStats } from "../lib/stats.js";
import { amountFor, METHOD_IDS } from "../shared/payment.js";
import { randomInt } from "node:crypto";

export const adminRouter = Router();
adminRouter.use(requireAdmin);

adminRouter.get("/me", (req, res) =>
  res.json({ ok: true, store: req.app.locals.store.kind, open: adminOpen(), user: publicUser(req.user) || null })
);

/* ── numbers ── */

adminRouter.get("/overview", async (req, res) => {
  const store = req.app.locals.store;
  const [events, regs, interest] = await Promise.all([
    store.events.list({ publishedOnly: false }),
    store.registrations.list({ limit: 0 }),
    store.interest.list(),
  ]);
  res.json({ overview: computeOverview(events, regs, interest.length) });
});

adminRouter.get("/events/:id/stats", async (req, res) => {
  const store = req.app.locals.store;
  const e = await store.events.get(req.params.id);
  if (!e) throw notFound("No such event");
  const [regs, pays] = await Promise.all([
    store.registrations.list({ eventId: String(e._id), limit: 0 }),
    store.payments.list({ eventId: String(e._id) }),
  ]);
  res.json({ stats: computeStats(e, regs, pays) });
});

/* ── events ── */

function eventForm(body) {
  const f = new Form(body)
    .text("title", { required: true, min: 2, max: 80 })
    .text("slug", { max: 80 })
    .oneOf("kind", EVENT_KINDS, { required: true })
    .text("tagline", { max: 160 })
    .text("description", { max: 2000 })
    .text("venue", { max: 120 })
    .text("city", { max: 60 })
    .date("startsAt", { required: true })
    .date("endsAt")
    .bool("published", true)
    .bool("featured", false)
    .bool("registrationOpen", true)
    .text("stallInfo", { max: 300 })
    .int("capacity", { min: 0, max: 1_000_000, fallback: 0 })
    .int("stallCapacity", { min: 0, max: 100_000, fallback: 0 })
    .int("priceVisitor", { min: 0, max: 1_000_000, fallback: 0 })
    .int("priceStall", { min: 0, max: 1_000_000, fallback: 0 });
  // stalls default by kind (festivals take them), but an admin can override either way
  const allow = body?.allowStalls;
  f.data.roles = allow === undefined || allow === null ? rolesFor(f.data.kind) : allow ? ["visitor", "stall"] : ["visitor"];
  if (f.data.startsAt && f.data.endsAt && f.data.endsAt < f.data.startsAt) f.errors.endsAt = "Ends before it starts";
  return f.done();
}

const toDoc = (d) => ({
  title: d.title,
  kind: d.kind,
  tagline: d.tagline,
  description: d.description,
  venue: d.venue,
  city: d.city || "Dhaka",
  startsAt: d.startsAt,
  endsAt: d.endsAt,
  registration: { open: d.registrationOpen, roles: d.roles, stallInfo: d.stallInfo, capacity: d.capacity, stallCapacity: d.stallCapacity },
  // 0 = free; the checkout is skipped entirely
  pricing: { visitor: d.priceVisitor, stall: d.priceStall },
  published: d.published,
  featured: d.featured,
  updatedAt: new Date(),
});

async function withCounts(store, e) {
  return { ...serialize(e), counts: await store.registrations.counts(String(e._id)) };
}

adminRouter.get("/events", async (req, res) => {
  const store = req.app.locals.store;
  const all = await store.events.list({ publishedOnly: false });
  res.json({ events: await Promise.all(all.map((e) => withCounts(store, e))) });
});

adminRouter.post("/events", async (req, res) => {
  const store = req.app.locals.store;
  const d = eventForm(req.body);
  let slug = slugify(d.slug || d.title) || "event";
  for (let n = 2; await store.events.get(slug); n += 1) slug = `${slugify(d.slug || d.title)}-${n}`;
  const e = await store.events.create({ slug, ...toDoc(d), createdAt: new Date() });
  res.status(201).json({ event: await withCounts(store, e) });
});

adminRouter.patch("/events/:id", async (req, res) => {
  const store = req.app.locals.store;
  const existing = await store.events.get(req.params.id);
  if (!existing) throw notFound("No such event");
  const d = eventForm({ ...req.body, slug: existing.slug });
  const e = await store.events.update(String(existing._id), toDoc(d));
  res.json({ event: await withCounts(store, e) });
});

adminRouter.delete("/events/:id", async (req, res) => {
  const store = req.app.locals.store;
  const existing = await store.events.get(req.params.id);
  if (!existing) throw notFound("No such event");
  const counts = await store.registrations.counts(String(existing._id));
  if (counts.total > 0) throw new HttpError(409, "This event has registrations — unpublish it instead of deleting");
  await store.events.remove(String(existing._id));
  res.json({ ok: true });
});

/* ── registrations ── */

const regFilter = (q) => ({
  eventId: q.event ? String(q.event) : undefined,
  role: ROLES.includes(q.role) ? q.role : undefined,
  status: ["pending", "confirmed", "cancelled"].includes(q.status) ? q.status : undefined,
});

adminRouter.get("/registrations", async (req, res) => {
  const store = req.app.locals.store;
  const rows = await store.registrations.list(regFilter(req.query));
  const events = new Map();
  const out = [];
  for (const r of rows) {
    if (!events.has(String(r.eventId))) events.set(String(r.eventId), await store.events.get(r.eventId));
    const pay = await store.payments.forRegistration(String(r._id));
    out.push({
      ...serialize(r),
      amount: amountFor(events.get(String(r.eventId)), r.role, r.guests),
      paid: pay?.status === "paid",
      paymentRef: pay?.ref || "",
      paymentMethod: pay?.method || "",
      paymentStatus: pay?.status || "",
      paymentGateway: pay?.gateway || "",
    });
  }
  res.json({ registrations: out });
});

adminRouter.patch("/registrations/:id", async (req, res) => {
  const store = req.app.locals.store;
  const { status } = new Form(req.body).oneOf("status", ["pending", "confirmed", "cancelled"], { required: true }).done();
  const r = await store.registrations.update(req.params.id, { status, updatedAt: new Date() });
  if (!r) throw notFound("No such registration");
  res.json({ registration: serialize(r) });
});

/* Staff settle what happens off the website: cash at the desk, a wallet transfer
   someone sent by hand, a refund. Each one is written down as a payment like any other. */
adminRouter.post("/registrations/:id/payment", async (req, res) => {
  const store = req.app.locals.store;
  const d = new Form(req.body)
    .oneOf("action", ["mark-paid", "refund"], { required: true })
    .oneOf("method", [...METHOD_IDS, "cash"], { fallback: "cash" })
    .text("txnId", { max: 60 })
    .text("note", { max: 200 })
    .done();

  const reg = await store.registrations.get(req.params.id);
  if (!reg) throw notFound("No such registration");
  const event = await store.events.get(reg.eventId);
  const existing = await store.payments.forRegistration(String(reg._id));

  if (d.action === "refund") {
    if (existing?.status !== "paid") throw new HttpError(409, "Nothing has been paid on this ticket");
    const x = await store.payments.update(String(existing._id), {
      status: "refunded",
      refundedAt: new Date(),
      refundedBy: req.user ? String(req.user._id) : "staff",
      note: d.note || existing.note || "",
    });
    return res.json({ payment: serialize(x) });
  }

  if (existing?.status === "paid") throw new HttpError(409, "That ticket is already paid");
  const amount = amountFor(event, reg.role, reg.guests);
  if (amount <= 0) throw new HttpError(409, "This one is free — nothing to collect");

  const payment = await store.payments.create({
    ref: "PAY-" + randomInt(10 ** 7, 10 ** 8 - 1),
    registrationId: String(reg._id),
    userId: reg.userId || "",
    eventId: String(reg.eventId),
    eventSlug: reg.eventSlug,
    amount,
    currency: "BDT",
    method: d.method,
    status: "paid",
    gateway: "counter",
    txnId: d.txnId,
    note: d.note,
    takenBy: req.user ? String(req.user._id) : "staff",
    createdAt: new Date(),
    paidAt: new Date(),
  });
  // money in means the seat is theirs
  await store.registrations.update(String(reg._id), { status: "confirmed", paidAt: payment.paidAt, updatedAt: new Date() });
  res.status(201).json({ payment: serialize(payment) });
});

/* the gate: who actually walked in */
adminRouter.post("/registrations/:id/checkin", async (req, res) => {
  const store = req.app.locals.store;
  const { undo } = new Form(req.body).bool("undo", false).done();
  const reg = await store.registrations.get(req.params.id);
  if (!reg) throw notFound("No such registration");
  if (!undo && reg.status === "cancelled") throw new HttpError(409, "That ticket is cancelled");
  const saved = await store.registrations.update(String(reg._id), {
    checkedInAt: undo ? null : new Date(),
    checkedInBy: undo ? null : req.user ? String(req.user._id) : "staff",
    updatedAt: new Date(),
  });
  res.json({ registration: serialize(saved) });
});

const csvCell = (v) => {
  const s = v instanceof Date ? v.toISOString() : v === null || v === undefined ? "" : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

adminRouter.get("/registrations.csv", async (req, res) => {
  const store = req.app.locals.store;
  const raw = await store.registrations.list(regFilter(req.query));
  const events = new Map();
  const rows = [];
  for (const r of raw) {
    if (!events.has(String(r.eventId))) events.set(String(r.eventId), await store.events.get(r.eventId));
    const pay = await store.payments.forRegistration(String(r._id));
    rows.push({
      ...r,
      amount: amountFor(events.get(String(r.eventId)), r.role, r.guests),
      paid: pay?.status === "paid" ? "yes" : "no",
      paymentRef: pay?.ref || "",
      paymentMethod: pay?.method || "",
      paymentStatus: pay?.status || "",
      paymentGateway: pay?.gateway || "",
    });
  }
  const cols = ["code", "status", "role", "name", "phone", "email", "business", "category", "guests", "amount", "paid", "paymentRef", "paymentMethod", "age", "gender", "area", "source", "note", "eventSlug", "createdAt"];
  const body = [cols.join(","), ...rows.map((r) => cols.map((c) => csvCell(r[c])).join(","))].join("\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="registrations-${req.query.event || "all"}.csv"`);
  res.send(body);
});

adminRouter.get("/interest", async (req, res) => {
  const rows = await req.app.locals.store.interest.list();
  res.json({ interest: rows.map(serialize) });
});

/* ── people with accounts ── */

adminRouter.get("/users", async (req, res) => {
  const store = req.app.locals.store;
  const role = ["visitor", "stall", "admin"].includes(req.query.role) ? req.query.role : undefined;
  const q = typeof req.query.q === "string" ? req.query.q.trim().slice(0, 80) : "";
  const users = await store.users.list({ role, q });
  const out = [];
  for (const u of users) {
    const regs = await store.registrations.listForUser({ userId: String(u._id), phone: u.phone });
    const { passwordHash: _hash, ...rest } = u;
    out.push({ ...serialize(rest), tickets: regs.filter((r) => r.status !== "cancelled").length });
  }
  res.json({ users: out });
});

adminRouter.patch("/users/:id", async (req, res) => {
  const store = req.app.locals.store;
  const { role } = new Form(req.body).oneOf("role", ["visitor", "stall", "admin"], { required: true }).done();
  const u = await store.users.update(req.params.id, { role, updatedAt: new Date() });
  if (!u) throw notFound("No such user");
  const { passwordHash: _hash, ...rest } = u;
  res.json({ user: serialize(rest) });
});

/* ── site settings ── */

// the hero strip: 1-4 pairs like "120+" / "events", short enough to stay on one line
const settingsForm = (body) =>
  new Form(body)
    .list("heroStats", (f) => f.text("value", { required: true, max: 12 }).text("label", { required: true, max: 24 }), { min: 1, max: 4 })
    .done();

adminRouter.get("/settings", async (req, res) => res.json({ settings: await req.app.locals.store.settings.get() }));

adminRouter.put("/settings", async (req, res) => {
  const d = settingsForm(req.body);
  const settings = await req.app.locals.store.settings.set({ ...d, updatedAt: new Date() });
  res.json({ settings });
});
