import { Router } from "express";
import { randomInt } from "node:crypto";
import { Form } from "../lib/validate.js";
import { HttpError, notFound } from "../lib/http.js";
import { isOver } from "../lib/events.js";
import { jsonOnly, requireUser } from "../lib/session.js";
import { METHOD_IDS, amountFor } from "../shared/payment.js";

export const payRouter = Router();
payRouter.use(jsonOnly, requireUser);

/* Checkout for a ticket.

   The gateway itself is pluggable: today GATEWAY is "sandbox", which walks the guest
   through a local imitation of a bKash/Nagad/card screen and never moves money. Wiring a
   real provider (SSLCommerz, bKash PGW) means filling in `start` and `verify` below —
   everything else, including what the rest of the app sees, stays the same. */

const GATEWAY = process.env.PAYMENT_GATEWAY || "sandbox";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const makeRef = () => "PAY-" + Array.from({ length: 8 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");

const view = (p, reg, event) => ({
  ref: p.ref,
  status: p.status,
  method: p.method,
  amount: p.amount,
  currency: p.currency,
  gateway: p.gateway,
  sandbox: p.gateway === "sandbox",
  createdAt: p.createdAt,
  paidAt: p.paidAt || null,
  txnId: p.txnId || "",
  ticket: reg && { id: String(reg._id), code: reg.code, role: reg.role, guests: reg.guests, business: reg.business || "" },
  event: event && { slug: event.slug, title: event.title, startsAt: event.startsAt, venue: event.venue, city: event.city },
});

async function ownTicket(store, user, id) {
  const r = await store.registrations.get(id);
  if (!r || (r.userId !== String(user._id) && r.phone !== user.phone)) throw notFound("No such ticket");
  return r;
}

/* start a checkout for one ticket */
payRouter.post("/registrations/:id/checkout", async (req, res) => {
  const store = req.app.locals.store;
  const { method } = new Form(req.body).oneOf("method", METHOD_IDS, { required: true }).done();
  const reg = await ownTicket(store, req.user, req.params.id);
  const event = await store.events.get(reg.eventId);

  if (reg.status === "cancelled") throw new HttpError(409, "That ticket is cancelled");
  if (event && isOver(event)) throw new HttpError(409, "That event has already happened");
  const amount = amountFor(event, reg.role, reg.guests);
  if (amount <= 0) throw new HttpError(409, "This one is free — nothing to pay");

  const already = await store.payments.forRegistration(String(reg._id));
  if (already?.status === "paid") return res.json({ payment: view(already, reg, event), alreadyPaid: true });

  const payment = await store.payments.create({
    ref: makeRef(),
    registrationId: String(reg._id),
    userId: String(req.user._id),
    eventId: String(reg.eventId),
    eventSlug: reg.eventSlug,
    amount,
    currency: "BDT",
    method,
    status: "created",
    gateway: GATEWAY,
    createdAt: new Date(),
  });

  // a real gateway would hand back its own hosted URL here
  res.status(201).json({ payment: view(payment, reg, event), checkoutUrl: `/pay/${payment.ref}` });
});

/* the checkout screen reads its own payment */
payRouter.get("/:ref", async (req, res) => {
  const store = req.app.locals.store;
  const p = await store.payments.byRef(String(req.params.ref).toUpperCase());
  if (!p || p.userId !== String(req.user._id)) throw notFound("No such payment");
  const reg = await store.registrations.get(p.registrationId);
  res.json({ payment: view(p, reg, reg && (await store.events.get(reg.eventId))) });
});

/* sandbox confirm — stands in for the gateway's callback */
payRouter.post("/:ref/confirm", async (req, res) => {
  const store = req.app.locals.store;
  const p = await store.payments.byRef(String(req.params.ref).toUpperCase());
  if (!p || p.userId !== String(req.user._id)) throw notFound("No such payment");
  if (p.status === "paid") {
    const reg = await store.registrations.get(p.registrationId);
    return res.json({ payment: view(p, reg, reg && (await store.events.get(reg.eventId))) });
  }
  if (p.status !== "created") throw new HttpError(409, "That payment is closed");
  if (p.gateway !== "sandbox") throw new HttpError(400, "This gateway confirms through its own callback");

  // wallets ask for a PIN on their screen; the sandbox accepts any five digits
  if (p.method !== "card") {
    const pin = String(req.body?.pin || "");
    if (!/^\d{5}$/.test(pin)) throw new HttpError(400, "Enter the 5-digit PIN", { pin: "Five digits" });
  }

  const paid = await store.payments.update(String(p._id), {
    status: "paid",
    paidAt: new Date(),
    txnId: "SBX" + randomInt(10 ** 9, 10 ** 10 - 1),
  });
  // paying confirms the seat: no one should have to chase it separately
  const reg = await store.registrations.update(p.registrationId, {
    status: "confirmed",
    paidAt: paid.paidAt,
    updatedAt: new Date(),
  });
  res.json({ payment: view(paid, reg, reg && (await store.events.get(reg.eventId))) });
});

payRouter.post("/:ref/cancel", async (req, res) => {
  const store = req.app.locals.store;
  const p = await store.payments.byRef(String(req.params.ref).toUpperCase());
  if (!p || p.userId !== String(req.user._id)) throw notFound("No such payment");
  if (p.status !== "created") throw new HttpError(409, "That payment is closed");
  const x = await store.payments.update(String(p._id), { status: "cancelled", closedAt: new Date() });
  res.json({ payment: view(x, null, null) });
});
