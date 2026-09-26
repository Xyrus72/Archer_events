import { AGE_RANGES, AREAS, GENDERS, SOURCES, STALL_CATEGORIES } from "../shared/options.js";
import { isOver } from "./events.js";
import { amountFor } from "../shared/payment.js";

const DAY = 86_400_000;
const dhakaDay = new Intl.DateTimeFormat("en-CA", { timeZone: "Asia/Dhaka", year: "numeric", month: "2-digit", day: "2-digit" });
const dhakaHour = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", hour: "2-digit", hour12: false });

/* rows → [{ label, n }] in a fixed order, unknown answers pooled at the end */
function tally(rows, key, order) {
  const m = new Map(order.map((k) => [k, 0]));
  let blank = 0;
  for (const r of rows) {
    const v = r[key];
    if (v && m.has(v)) m.set(v, m.get(v) + 1);
    else blank += 1;
  }
  const out = [...m].map(([label, n]) => ({ label, n }));
  if (blank) out.push({ label: "Not answered", n: blank });
  return out;
}

/* Everything the ticket office shows for one event, computed from its registrations. */
export function computeStats(event, regs, pays = [], now = Date.now()) {
  const active = regs.filter((r) => r.status !== "cancelled");
  const visitors = active.filter((r) => r.role === "visitor");
  const stalls = active.filter((r) => r.role === "stall");
  const heads = visitors.reduce((n, r) => n + (r.guests || 1), 0);

  const days = new Map();
  const hours = Array.from({ length: 24 }, (_, hour) => ({ hour, n: 0 }));
  for (const r of active) {
    const day = dhakaDay.format(r.createdAt);
    const row = days.get(day) || { day, visitors: 0, stalls: 0 };
    row[r.role === "stall" ? "stalls" : "visitors"] += 1;
    days.set(day, row);
    hours[Number(dhakaHour.format(r.createdAt)) % 24].n += 1;
  }

  const party = new Map();
  for (const r of visitors) party.set(r.guests || 1, (party.get(r.guests || 1) || 0) + 1);

  const paid = pays.filter((p) => p.status === "paid");
  const takings = paid.reduce((n, p) => n + (p.amount || 0), 0);
  const owed = active
    .filter((r) => !paid.some((p) => p.registrationId === String(r._id)))
    .reduce((n, r) => n + amountFor(event, r.role, r.guests), 0);

  return {
    money: {
      takings,
      owed,
      paidCount: paid.length,
      refunded: pays.filter((p) => p.status === "refunded").reduce((n, p) => n + (p.amount || 0), 0),
      atCounter: paid.filter((p) => p.gateway === "counter").length,
    },
    totals: {
      checkedIn: active.filter((r) => r.checkedInAt).length,
      registrations: active.length,
      visitors: visitors.length,
      heads,
      stalls: stalls.length,
      confirmed: active.filter((r) => r.status === "confirmed").length,
      pending: active.filter((r) => r.status === "pending").length,
      cancelled: regs.length - active.length,
      last24: active.filter((r) => now - r.createdAt.getTime() < DAY).length,
      last7: active.filter((r) => now - r.createdAt.getTime() < 7 * DAY).length,
      withEmail: active.filter((r) => r.email).length,
    },
    capacity: { visitors: event.registration?.capacity || 0, stalls: event.registration?.stallCapacity || 0 },
    avgParty: visitors.length ? Math.round((heads / visitors.length) * 10) / 10 : 0,
    party: [...party].sort((a, b) => a[0] - b[0]).map(([size, n]) => ({ label: size === 1 ? "Solo" : `${size} people`, n })),
    age: tally(active, "age", AGE_RANGES),
    gender: tally(active, "gender", GENDERS),
    area: tally(active, "area", AREAS),
    source: tally(active, "source", SOURCES),
    category: tally(stalls, "category", STALL_CATEGORIES),
    timeline: [...days.values()].sort((a, b) => a.day.localeCompare(b.day)),
    hours,
    daysToGo: isOver(event, now) ? null : Math.max(0, Math.ceil((event.startsAt.getTime() - now) / DAY)),
  };
}

/* The strip across the top of the ticket office: the whole calendar at a glance. */
export function computeOverview(events, regs, waiting, now = Date.now()) {
  const active = regs.filter((r) => r.status !== "cancelled");
  const visitors = active.filter((r) => r.role === "visitor");
  return {
    events: events.length,
    upcoming: events.filter((e) => e.published && !isOver(e, now)).length,
    registrations: active.length,
    heads: visitors.reduce((n, r) => n + (r.guests || 1), 0),
    stalls: active.filter((r) => r.role === "stall").length,
    last7: active.filter((r) => now - r.createdAt.getTime() < 7 * DAY).length,
    waiting,
  };
}
