import { after, before, test } from "node:test";
import assert from "node:assert/strict";

/* The API end to end, against the in-memory store — the same code path the site runs on
   until MongoDB is connected. Each test builds on the state the previous one left. */

process.env.ADMIN_KEY = "test-admin-key";
process.env.SESSION_SECRET = "test-session-secret";
process.env.RATE_LIMIT_MAX = "1000";
delete process.env.MONGODB_URI;
delete process.env.DEMO_DATA;

// the secret is read when the session module loads, so the app is imported only now
const { createApp } = await import("../app.js");

let server;
let base;
const state = {};

before(async () => {
  const { app } = await createApp({ serveStatic: false });
  server = app.listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}`;
});

after(() => new Promise((resolve) => server.close(resolve)));

const JSON_HEADERS = { "Content-Type": "application/json" };
const ADMIN = { ...JSON_HEADERS, Authorization: `Bearer ${process.env.ADMIN_KEY}` };

async function call(method, path, { body, headers = JSON_HEADERS, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: { ...headers, ...(cookie ? { cookie } : {}) },
    body: body === undefined ? undefined : body instanceof Uint8Array || typeof body === "string" ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let data = text;
  try {
    data = JSON.parse(text);
  } catch {
    /* images and html stay as text */
  }
  return { status: res.status, data, headers: res.headers, cookie: res.headers.get("set-cookie")?.split(";")[0] };
}

/* a real 1×1 PNG, so the byte sniffer has something honest to look at */
const PNG = Uint8Array.from(
  Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==", "base64")
);

test("health reports the in-memory store", async () => {
  const { status, data } = await call("GET", "/api/health");
  assert.equal(status, 200);
  assert.equal(data.store, "memory");
  assert.equal(data.demo, false);
});

test("the seeded event is on the public calendar", async () => {
  const { status, data } = await call("GET", "/api/events");
  assert.equal(status, 200);
  const slugs = [...data.upcoming, ...data.past].map((e) => e.slug);
  assert.ok(slugs.includes("offline-mela"));
});

test("the ticket office is locked without the key", async () => {
  assert.equal((await call("GET", "/api/admin/events")).status, 401);
  assert.equal((await call("GET", "/api/admin/events", { headers: ADMIN })).status, 200);
});

test("staff create a priced festival and a visitor-only concert", async () => {
  const mela = await call("POST", "/api/admin/events", {
    headers: ADMIN,
    body: { title: "Test Mela", kind: "festival", startsAt: "2099-01-10T11:00:00+06:00", priceVisitor: 500, priceStall: 3000 },
  });
  assert.equal(mela.status, 201);
  assert.deepEqual(mela.data.event.registration.roles, ["visitor", "stall"]);
  state.mela = mela.data.event;

  const gig = await call("POST", "/api/admin/events", {
    headers: ADMIN,
    body: { title: "Test Gig", kind: "concert", startsAt: "2099-02-10T19:00:00+06:00" },
  });
  assert.equal(gig.status, 201);
  assert.deepEqual(gig.data.event.registration.roles, ["visitor"]);
  state.gig = gig.data.event;
});

test("registration validates by role and event kind", async () => {
  const noStore = await call("POST", "/api/registrations", {
    body: { event: state.mela.slug, role: "stall", name: "Shop Owner", phone: "01711000001", category: "Food & drinks" },
  });
  assert.equal(noStore.status, 400);
  assert.ok(noStore.data.details.business);

  const badPhone = await call("POST", "/api/registrations", {
    body: { event: state.mela.slug, role: "visitor", name: "Guest", phone: "12345", age: "25-34" },
  });
  assert.equal(badPhone.status, 400);
  assert.ok(badPhone.data.details.phone);

  const stallAtGig = await call("POST", "/api/registrations", {
    body: { event: state.gig.slug, role: "stall", name: "Shop Owner", phone: "01711000001", business: "Shop" },
  });
  assert.equal(stallAtGig.status, 400);
  assert.ok(stallAtGig.data.details.role);
});

test("a visitor gets a ticket code, and registering twice returns the same ticket", async () => {
  const body = { event: state.mela.slug, role: "visitor", name: "Nusrat Jahan", phone: "01711000002", guests: 2, age: "25-34" };
  const first = await call("POST", "/api/registrations", { body });
  assert.equal(first.status, 201);
  assert.match(first.data.registration.code, /^ARC-[A-Z2-9]{6}$/);

  const again = await call("POST", "/api/registrations", { body });
  assert.equal(again.status, 200);
  assert.equal(again.data.duplicate, true);
  assert.equal(again.data.registration.code, first.data.registration.code);
  state.walkIn = first.data.registration;
});

test("accounts: sign-up, sign-in, and the guards around them", async () => {
  const admin = await call("POST", "/api/auth/register", {
    body: { role: "admin", name: "Sneaky", phone: "01711000003", password: "long-enough-1" },
  });
  assert.equal(admin.status, 400, "nobody signs themselves up as staff");

  const up = await call("POST", "/api/auth/register", {
    body: { role: "visitor", name: "Priya Das", phone: "01711000004", password: "long-enough-1" },
  });
  assert.equal(up.status, 201);
  assert.ok(up.cookie?.startsWith("archer_session="));
  assert.equal(up.data.user.passwordHash, undefined, "the hash never leaves the server");

  const dup = await call("POST", "/api/auth/register", {
    body: { role: "visitor", name: "Priya Das", phone: "01711000004", password: "long-enough-1" },
  });
  assert.equal(dup.status, 409);

  assert.equal((await call("POST", "/api/auth/login", { body: { phone: "01711000004", password: "wrong-one-1" } })).status, 401);
  const malformed = await call("POST", "/api/auth/login", { body: { phone: "12345", password: "x" } });
  assert.equal(malformed.status, 400);
  assert.ok(malformed.data.details.phone);
  const form = await call("POST", "/api/auth/login", {
    body: "phone=01711000004&password=long-enough-1",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
  });
  assert.equal(form.status, 415, "cookie-auth routes only take JSON");

  const inside = await call("POST", "/api/auth/login", { body: { phone: "01711000004", password: "long-enough-1" } });
  assert.equal(inside.status, 200);
  state.cookie = inside.cookie;

  assert.equal((await call("GET", "/api/auth/me", { cookie: state.cookie })).data.user.name, "Priya Das");
  assert.equal((await call("GET", "/api/auth/me")).data.user, null);
});

test("a signed-in guest registers, pays in the sandbox, and the seat confirms", async () => {
  const reg = await call("POST", "/api/registrations", {
    cookie: state.cookie,
    body: { event: state.mela.slug, role: "visitor", name: "Priya Das", phone: "01711000004", guests: 1, age: "18-24" },
  });
  assert.equal(reg.status, 201);

  const mine = await call("GET", "/api/me/registrations", { cookie: state.cookie });
  const ticket = mine.data.registrations.find((t) => t.code === reg.data.registration.code);
  assert.equal(ticket.amount, 500);
  assert.equal(ticket.status, "pending");

  const start = await call("POST", `/api/pay/registrations/${ticket.id}/checkout`, { cookie: state.cookie, body: { method: "bkash" } });
  assert.equal(start.status, 201);
  assert.equal(start.data.checkoutUrl, `/pay/${start.data.payment.ref}`);

  const ref = start.data.payment.ref;
  assert.equal((await call("POST", `/api/pay/${ref}/confirm`, { cookie: state.cookie, body: { pin: "12" } })).status, 400);
  const paid = await call("POST", `/api/pay/${ref}/confirm`, { cookie: state.cookie, body: { pin: "12345" } });
  assert.equal(paid.data.payment.status, "paid");

  const after = await call("GET", "/api/me/registrations", { cookie: state.cookie });
  assert.equal(after.data.registrations.find((t) => t.id === ticket.id).status, "confirmed");

  const cancel = await call("PATCH", `/api/me/registrations/${ticket.id}`, { cookie: state.cookie, body: { status: "cancelled" } });
  assert.equal(cancel.status, 409, "a paid ticket is not self-cancelled");

  const other = await call("PATCH", `/api/me/registrations/${state.walkIn.id}`, { cookie: state.cookie, body: { status: "cancelled" } });
  assert.equal(other.status, 404, "nobody touches someone else's ticket");
});

test("the desk takes cash, refunds it, and checks people in", async () => {
  const id = state.walkIn.id;
  const take = await call("POST", `/api/admin/registrations/${id}/payment`, {
    headers: ADMIN,
    body: { action: "mark-paid", method: "cash", txnId: "RCPT-1" },
  });
  assert.equal(take.status, 201);
  assert.equal(take.data.payment.amount, 1000, "two guests at 500");

  const refund = await call("POST", `/api/admin/registrations/${id}/payment`, { headers: ADMIN, body: { action: "refund", note: "test" } });
  assert.equal(refund.data.payment.status, "refunded");

  const gate = await call("POST", `/api/admin/registrations/${id}/checkin`, { headers: ADMIN, body: {} });
  assert.ok(gate.data.registration.checkedInAt);

  const stats = await call("GET", `/api/admin/events/${state.mela.id}/stats`, { headers: ADMIN });
  assert.equal(stats.data.stats.money.takings, 500, "only the sandbox payment is still standing");
  assert.equal(stats.data.stats.totals.checkedIn, 1);
});

test("homepage stats are counted live, not typed in", async () => {
  const pub = await call("GET", "/api/settings");
  assert.equal(pub.status, 200);
  const [events, guests, cities] = pub.data.settings.heroStats;
  assert.match(events.label, /^events?$/);
  assert.match(guests.label, /^guests?$/);
  assert.match(cities.label, /^(city|cities)$/);
  assert.ok(Number(events.value.replace(/,/g, "")) >= 1, "the seeded event is counted");
});

test("gallery photos: sniffed, stored, served, and removed with their tile", async () => {
  const tile = await call("POST", "/api/admin/gallery", { headers: ADMIN, body: { title: "Test Night", category: "Concert" } });
  assert.equal(tile.status, 201);
  const id = tile.data.item.id;

  const text = await call("PUT", `/api/admin/gallery/${id}/image`, {
    headers: { Authorization: ADMIN.Authorization, "Content-Type": "image/png" },
    body: new TextEncoder().encode("this is plainly not a picture of anything"),
  });
  assert.equal(text.status, 415);

  const up = await call("PUT", `/api/admin/gallery/${id}/image`, {
    headers: { Authorization: ADMIN.Authorization, "Content-Type": "image/png" },
    body: PNG,
  });
  assert.equal(up.status, 200);
  const url = up.data.item.url;

  const served = await fetch(base + url);
  assert.equal(served.status, 200);
  assert.equal(served.headers.get("content-type"), "image/png");
  assert.match(served.headers.get("cache-control"), /immutable/);

  const pub = await call("GET", "/api/gallery");
  assert.ok(pub.data.gallery.some((g) => g.url === url));

  await call("DELETE", `/api/admin/gallery/${id}`, { headers: ADMIN });
  assert.equal((await fetch(base + url)).status, 404);
});
