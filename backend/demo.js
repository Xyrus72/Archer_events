import { makeCode } from "./lib/codes.js";
import { AGE_RANGES, AREAS, GENDERS, SOURCES, STALL_CATEGORIES } from "./shared/options.js";
import { DEMO_EVENTS, DEMO_PLAN, FIRST, LAST, NOTES, SHOPS, pick, rnd } from "./demo-data.js";
import { hashPassword } from "./lib/session.js";

const DAY = 86_400_000;

/* Fills the in-memory store with fake events and registrations (DEMO_DATA=1) so the
   ticket office can be explored before real data exists. Never runs against MongoDB. */
export async function seedDemo(store, now = Date.now()) {
  for (const e of DEMO_EVENTS) {
    if (await store.events.get(e.slug)) continue;
    await store.events.create({ ...e, createdAt: new Date(now - 40 * DAY), updatedAt: new Date(now - 40 * DAY) });
  }

  let n = 0;
  for (const [slug, visitors, stalls, spanDays] of DEMO_PLAN) {
    const event = await store.events.get(slug);
    if (!event) continue;
    // the past mela filled up before it happened; live events fill up towards now
    const before = slug === "offline-mela" ? now - 1.5 * DAY : now;
    for (let i = 0; i < visitors + stalls; i += 1) {
      const stall = i >= visitors;
      const first = pick(FIRST);
      const last = pick(LAST);
      const ago = Math.pow(rnd(), 1.6) * spanDays * DAY; // more sign-ups closer to the present
      const hourShift = (rnd() * 14 + 8) * 3600_000 * (rnd() < 0.85 ? 1 : 0.3); // mostly daytime, some late
      n += 1;
      try {
        await store.registrations.create({
          eventId: String(event._id),
          eventSlug: slug,
          role: stall ? "stall" : "visitor",
          phone: `+88017${String(10000000 + n * 7919).slice(-8)}`,
          code: makeCode(),
          name: `${first} ${last}`,
          email: rnd() < 0.55 ? `${first.toLowerCase()}.${last.toLowerCase()}@example.com` : "",
          business: stall ? `${first}'s ${pick(SHOPS)}` : "",
          guests: stall ? 0 : pick([1, 2, 3, 4, 5], [40, 30, 17, 9, 4]),
          age: pick(AGE_RANGES, [6, 34, 32, 16, 8, 4]),
          gender: pick(GENDERS.concat(""), [44, 40, 8, 8]),
          area: pick(AREAS.concat(""), [18, 16, 12, 9, 11, 7, 9, 6, 12]),
          source: pick(SOURCES.concat(""), [30, 26, 12, 14, 5, 6, 3, 4]),
          category: stall ? pick(STALL_CATEGORIES, [22, 20, 12, 10, 14, 10, 4, 5, 3]) : "",
          note: pick(NOTES),
          status: pick(["pending", "confirmed", "cancelled"], [62, 32, 6]),
          via: "demo",
          ip: "",
          createdAt: new Date(before - ago - hourShift),
        });
      } catch (err) {
        if (err.code !== 11000) throw err;
      }
    }
  }

  // three accounts to sign in with, one per role; their phones match demo tickets above
  const DEMO_USERS = [
    { role: "visitor", name: "Priya Das", phone: "+8801711111111", email: "priya@example.com", business: "", password: "archer123" },
    { role: "stall", name: "Rafi Ahmed", phone: "+8801722222222", email: "rafi@example.com", business: "Rafi's Threads", password: "archer123" },
    { role: "admin", name: "Archer Staff", phone: "+8801700000000", email: "", business: "", password: "admin123" },
  ];
  for (const u of DEMO_USERS) {
    // the demo staff account is a published password; it belongs on a laptop, never
    // anywhere with a real admin key set
    if (u.role === "admin" && process.env.ADMIN_KEY) continue;
    if (await store.users.byPhone(u.phone)) continue;
    const { password, ...rest } = u;
    const saved = await store.users.create({
      ...rest,
      passwordHash: hashPassword(password),
      createdAt: new Date(now - 20 * DAY),
      lastLoginAt: new Date(now - DAY),
    });
    // give the two guests a few real tickets by renaming some demo rows onto their numbers
    if (u.role !== "admin") {
      const rows = await store.registrations.list({ limit: 0 });
      const theirs = rows.filter((r) => (u.role === "stall" ? r.role === "stall" : r.role === "visitor")).slice(0, 3);
      for (const r of theirs) {
        await store.registrations.update(String(r._id), {
          name: u.name,
          phone: u.phone,
          email: u.email,
          userId: String(saved._id),
          ...(u.role === "stall" ? { business: u.business } : {}),
        });
      }
    }
  }
  console.warn(
    "[demo] sign in with 01711111111 / archer123 (visitor), 01722222222 / archer123 (stall)" +
      (process.env.ADMIN_KEY ? "" : ", 01700000000 / admin123 (admin)")
  );

  for (let i = 0; i < 6; i += 1) {
    await store.interest.upsert({
      name: `${pick(FIRST)} ${pick(LAST)}`,
      phone: `+88019${String(10000000 + i * 3571).slice(-8)}`,
      email: "",
      note: "",
      via: "demo",
      ip: "",
      createdAt: new Date(now - rnd() * 10 * DAY),
    });
  }
  return n;
}
