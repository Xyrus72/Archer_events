import { Router } from "express";
import { Form } from "../lib/validate.js";
import { HttpError, notFound } from "../lib/http.js";
import { isLive, isOver } from "../lib/events.js";
import { jsonOnly, requireUser } from "../lib/session.js";
import { amountFor } from "../shared/payment.js";

export const meRouter = Router();
meRouter.use(jsonOnly, requireUser);

/* a ticket as its owner sees it: the code, where to be, and whether it can still be cancelled */
const ticket = (r, e, pay) => ({
  id: String(r._id),
  code: r.code,
  role: r.role,
  status: r.status,
  name: r.name,
  phone: r.phone,
  email: r.email || "",
  business: r.business || "",
  category: r.category || "",
  guests: r.guests || 0,
  note: r.note || "",
  createdAt: r.createdAt,
  checkedInAt: r.checkedInAt || null,
  amount: amountFor(e, r.role, r.guests),
  payment: pay && { ref: pay.ref, status: pay.status, method: pay.method, amount: pay.amount, paidAt: pay.paidAt || null },
  event: e && {
    id: String(e._id),
    slug: e.slug,
    title: e.title,
    kind: e.kind,
    startsAt: e.startsAt,
    endsAt: e.endsAt,
    venue: e.venue,
    city: e.city,
    live: isLive(e),
    over: isOver(e),
  },
});

async function own(store, user, id) {
  const r = await store.registrations.get(id);
  const mine = r && (r.userId === String(user._id) || r.phone === user.phone);
  if (!mine) throw notFound("No such ticket");
  return r;
}

meRouter.get("/registrations", async (req, res) => {
  const store = req.app.locals.store;
  const rows = await store.registrations.listForUser({ userId: String(req.user._id), phone: req.user.phone });
  const events = new Map();
  const out = [];
  for (const r of rows) {
    if (!events.has(r.eventId)) events.set(r.eventId, await store.events.get(r.eventId));
    out.push(ticket(r, events.get(r.eventId), await store.payments.forRegistration(String(r._id))));
  }
  out.sort((a, b) => new Date(b.event?.startsAt || 0) - new Date(a.event?.startsAt || 0));
  res.json({ registrations: out });
});

meRouter.patch("/registrations/:id", async (req, res) => {
  const store = req.app.locals.store;
  const { status } = new Form(req.body).oneOf("status", ["cancelled"], { required: true }).done();
  const r = await own(store, req.user, req.params.id);
  const e = await store.events.get(r.eventId);
  if (r.checkedInAt) throw new HttpError(409, "You have already checked in at the gate");
  const paid = await store.payments.forRegistration(String(r._id));
  if (paid?.status === "paid") throw new HttpError(409, "This ticket is paid — message us and we'll sort the refund");
  if (e && isOver(e)) throw new HttpError(409, "That event has already happened");
  const saved = await store.registrations.update(String(r._id), { status, updatedAt: new Date() });
  res.json({ registration: ticket(saved, e, await store.payments.forRegistration(String(r._id))) });
});
