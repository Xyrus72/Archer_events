import { randomUUID } from "node:crypto";
import { SITE_DEFAULTS } from "../data/site-defaults.js";

/* In-process store with the same surface as the Mongo one.
   Used automatically when MONGODB_URI is unset, so the site runs end-to-end in dev. */
export function memoryStore() {
  const events = new Map();
  const regs = new Map();
  const interest = new Map();
  const users = new Map();
  const payments = new Map();
  const gallery = new Map();
  const files = new Map();
  const settings = {};
  const where = (map, pred) => [...map.values()].filter(pred);
  const active = (r) => r.status !== "cancelled";

  return {
    kind: "memory",

    events: {
      async list({ publishedOnly = true } = {}) {
        return where(events, (e) => !publishedOnly || e.published).sort((a, b) => a.startsAt - b.startsAt);
      },
      async get(idOrSlug) {
        return events.get(idOrSlug) || where(events, (e) => e.slug === idOrSlug)[0] || null;
      },
      async create(doc) {
        const d = { _id: randomUUID(), ...doc };
        events.set(d._id, d);
        return d;
      },
      async update(id, patch) {
        const e = events.get(id);
        if (!e) return null;
        Object.assign(e, patch);
        return e;
      },
      async remove(id) {
        return events.delete(id);
      },
    },

    registrations: {
      async findDuplicate({ eventId, phone, role }) {
        return where(regs, (r) => r.eventId === eventId && r.phone === phone && r.role === role)[0] || null;
      },
      async create(doc) {
        if (where(regs, (r) => r.code === doc.code).length) throw Object.assign(new Error("dup code"), { code: 11000 });
        const d = { _id: randomUUID(), ...doc };
        regs.set(d._id, d);
        return d;
      },
      async get(id) {
        return regs.get(id) || null;
      },
      async byCode(code) {
        return where(regs, (r) => r.code === code)[0] || null;
      },
      // tickets made before the account existed become theirs on sign-up
      async claim(phone, userId) {
        for (const r of where(regs, (x) => x.phone === phone && !x.userId)) r.userId = userId;
      },
      // a person's own tickets: linked by account, or by the phone they registered with
      async listForUser({ userId, phone }) {
        return where(regs, (r) => (userId && r.userId === userId) || (phone && r.phone === phone)).sort(
          (a, b) => b.createdAt - a.createdAt
        );
      },
      async list({ eventId, role, status } = {}) {
        return where(
          regs,
          (r) => (!eventId || r.eventId === eventId) && (!role || r.role === role) && (!status || r.status === status)
        ).sort((a, b) => b.createdAt - a.createdAt);
      },
      async counts(eventId) {
        const rows = where(regs, (r) => r.eventId === eventId && active(r));
        const visitor = rows.filter((r) => r.role === "visitor");
        return {
          visitor: visitor.length,
          guests: visitor.reduce((n, r) => n + (r.guests || 1), 0),
          stall: rows.filter((r) => r.role === "stall").length,
          total: rows.length,
        };
      },
      async update(id, patch) {
        const r = regs.get(id);
        if (!r) return null;
        Object.assign(r, patch);
        return r;
      },
    },

    interest: {
      async upsert(doc) {
        const existing = where(interest, (i) => i.phone === doc.phone)[0];
        if (existing) return { doc: existing, created: false };
        const d = { _id: randomUUID(), ...doc };
        interest.set(d._id, d);
        return { doc: d, created: true };
      },
      async list() {
        return [...interest.values()].sort((a, b) => b.createdAt - a.createdAt);
      },
    },

    files: {
      async put(doc) {
        files.set(doc.name, doc);
        return doc;
      },
      async get(name) {
        return files.get(name) || null;
      },
      async remove(name) {
        return files.delete(name);
      },
    },

    gallery: {
      async list({ publishedOnly = true } = {}) {
        return where(gallery, (g) => !publishedOnly || g.published).sort((a, b) => a.order - b.order);
      },
      async get(id) {
        return gallery.get(id) || null;
      },
      async create(doc) {
        const d = { _id: randomUUID(), ...doc };
        gallery.set(d._id, d);
        return d;
      },
      async update(id, patch) {
        const g = gallery.get(id);
        if (!g) return null;
        Object.assign(g, patch);
        return g;
      },
      async remove(id) {
        return gallery.delete(id);
      },
    },

    payments: {
      async create(doc) {
        const d = { _id: randomUUID(), ...doc };
        payments.set(d._id, d);
        return d;
      },
      async byRef(ref) {
        return where(payments, (x) => x.ref === ref)[0] || null;
      },
      // the live attempt for a ticket: paid wins, else the newest one still open
      async forRegistration(registrationId) {
        const rows = where(payments, (x) => x.registrationId === registrationId).sort((a, b) => b.createdAt - a.createdAt);
        return rows.find((x) => x.status === "paid") || rows[0] || null;
      },
      async update(id, patch) {
        const x = payments.get(id);
        if (!x) return null;
        Object.assign(x, patch);
        return x;
      },
      async list({ eventId, status } = {}) {
        return where(payments, (x) => (!eventId || x.eventId === eventId) && (!status || x.status === status)).sort(
          (a, b) => b.createdAt - a.createdAt
        );
      },
    },

    users: {
      async create(doc) {
        if (where(users, (u) => u.phone === doc.phone).length) throw Object.assign(new Error("phone taken"), { code: 11000 });
        const d = { _id: randomUUID(), ...doc };
        users.set(d._id, d);
        return d;
      },
      async get(id) {
        return users.get(id) || null;
      },
      async byPhone(phone) {
        return where(users, (u) => u.phone === phone)[0] || null;
      },
      async update(id, patch) {
        const u = users.get(id);
        if (!u) return null;
        Object.assign(u, patch);
        return u;
      },
      async list({ role, q, limit = 500 } = {}) {
        const needle = (q || "").toLowerCase();
        return where(
          users,
          (u) =>
            (!role || u.role === role) &&
            (!needle ||
              [u.name, u.phone, u.email, u.business].some((v) => String(v || "").toLowerCase().includes(needle)))
        )
          .sort((a, b) => b.createdAt - a.createdAt)
          .slice(0, limit);
      },
      async count() {
        return users.size;
      },
    },

    // one document for the whole site; whatever was never set falls through to the defaults
    settings: {
      async get() {
        return { ...SITE_DEFAULTS, ...settings };
      },
      async set(patch) {
        Object.assign(settings, patch);
        return { ...SITE_DEFAULTS, ...settings };
      },
    },
  };
}
