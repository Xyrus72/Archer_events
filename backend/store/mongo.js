import { MongoClient, ObjectId } from "mongodb";
import { SITE_DEFAULTS } from "../data/site-defaults.js";

const isOid = (v) => typeof v === "string" && /^[0-9a-f]{24}$/i.test(v);
const oid = (v) => (isOid(v) ? new ObjectId(v) : v instanceof ObjectId ? v : null);

/* MongoDB-backed store. Database comes from the URI path, or MONGODB_DB, else "archer". */
export async function mongoStore(uri) {
  const client = new MongoClient(uri, { serverSelectionTimeoutMS: 8000 });
  await client.connect();
  const db = client.db(process.env.MONGODB_DB || undefined);
  const dbName = db.databaseName === "test" && !process.env.MONGODB_DB ? "archer" : db.databaseName;
  const base = client.db(dbName);
  const events = base.collection("events");
  const regs = base.collection("registrations");
  const interest = base.collection("interest");
  const users = base.collection("users");
  const payments = base.collection("payments");
  const gallery = base.collection("gallery");
  const files = base.collection("files");
  const settings = base.collection("settings");

  await Promise.all([
    events.createIndex({ slug: 1 }, { unique: true }),
    events.createIndex({ startsAt: 1 }),
    regs.createIndex({ code: 1 }, { unique: true }),
    regs.createIndex({ eventId: 1, phone: 1, role: 1 }, { unique: true }),
    regs.createIndex({ eventId: 1, createdAt: -1 }),
    interest.createIndex({ phone: 1 }, { unique: true }),
    users.createIndex({ phone: 1 }, { unique: true }),
    users.createIndex({ createdAt: -1 }),
    payments.createIndex({ ref: 1 }, { unique: true }),
    payments.createIndex({ registrationId: 1, createdAt: -1 }),
    gallery.createIndex({ order: 1 }),
    files.createIndex({ name: 1 }, { unique: true }),
  ]);

  const active = { status: { $ne: "cancelled" } };

  return {
    kind: "mongo",
    dbName,
    close: () => client.close(),

    events: {
      list: ({ publishedOnly = true } = {}) =>
        events.find(publishedOnly ? { published: true } : {}).sort({ startsAt: 1 }).toArray(),
      get: (idOrSlug) => events.findOne(isOid(idOrSlug) ? { _id: oid(idOrSlug) } : { slug: idOrSlug }),
      create: async (doc) => {
        const r = await events.insertOne(doc);
        return { _id: r.insertedId, ...doc };
      },
      update: (id, patch) => events.findOneAndUpdate({ _id: oid(id) }, { $set: patch }, { returnDocument: "after" }),
      remove: async (id) => (await events.deleteOne({ _id: oid(id) })).deletedCount > 0,
    },

    registrations: {
      findDuplicate: ({ eventId, phone, role }) => regs.findOne({ eventId: oid(eventId), phone, role }),
      create: async (doc) => {
        const d = { ...doc, eventId: oid(doc.eventId) };
        const r = await regs.insertOne(d);
        return { _id: r.insertedId, ...d };
      },
      get: (id) => regs.findOne({ _id: oid(id) }),
      byCode: (code) => regs.findOne({ code }),
      // tickets made before the account existed become theirs on sign-up
      claim: async (phone, userId) => {
        await regs.updateMany({ phone, userId: { $in: [null, undefined] } }, { $set: { userId } });
      },
      // a person's own tickets: linked by account, or by the phone they registered with
      listForUser: ({ userId, phone }) =>
        regs
          .find({ $or: [...(userId ? [{ userId }] : []), ...(phone ? [{ phone }] : [])] })
          .sort({ createdAt: -1 })
          .limit(500)
          .toArray(),
      // limit 0 = everything (stats); the table view caps at 2000
      list: ({ eventId, role, status, limit = 2000 } = {}) =>
        regs
          .find({
            ...(eventId ? { eventId: oid(eventId) } : {}),
            ...(role ? { role } : {}),
            ...(status ? { status } : {}),
          })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray(),
      counts: async (eventId) => {
        const rows = await regs
          .aggregate([
            { $match: { eventId: oid(eventId), ...active } },
            { $group: { _id: "$role", n: { $sum: 1 }, guests: { $sum: { $ifNull: ["$guests", 0] } } } },
          ])
          .toArray();
        const by = Object.fromEntries(rows.map((r) => [r._id, r]));
        return {
          visitor: by.visitor?.n || 0,
          guests: by.visitor?.guests || 0,
          stall: by.stall?.n || 0,
          total: rows.reduce((n, r) => n + r.n, 0),
        };
      },
      update: (id, patch) => regs.findOneAndUpdate({ _id: oid(id) }, { $set: patch }, { returnDocument: "after" }),
    },

    interest: {
      upsert: async (doc) => {
        const existing = await interest.findOne({ phone: doc.phone });
        if (existing) return { doc: existing, created: false };
        const r = await interest.insertOne(doc);
        return { doc: { _id: r.insertedId, ...doc }, created: true };
      },
      list: () => interest.find().sort({ createdAt: -1 }).limit(2000).toArray(),
    },

    files: {
      put: async (doc) => {
        await files.insertOne(doc);
        return doc;
      },
      get: async (name) => {
        const f = await files.findOne({ name });
        // the driver hands back BSON Binary; the routes want a plain Buffer
        return f && { ...f, data: f.data?.buffer ? Buffer.from(f.data.buffer) : Buffer.from(f.data) };
      },
      remove: async (name) => (await files.deleteOne({ name })).deletedCount > 0,
    },

    gallery: {
      list: ({ publishedOnly = true } = {}) =>
        gallery.find(publishedOnly ? { published: true } : {}).sort({ order: 1 }).toArray(),
      get: (id) => (isOid(id) ? gallery.findOne({ _id: oid(id) }) : null),
      create: async (doc) => {
        const r = await gallery.insertOne(doc);
        return { _id: r.insertedId, ...doc };
      },
      update: (id, patch) => gallery.findOneAndUpdate({ _id: oid(id) }, { $set: patch }, { returnDocument: "after" }),
      remove: async (id) => (await gallery.deleteOne({ _id: oid(id) })).deletedCount > 0,
    },

    payments: {
      create: async (doc) => {
        const r = await payments.insertOne(doc);
        return { _id: r.insertedId, ...doc };
      },
      byRef: (ref) => payments.findOne({ ref }),
      // the live attempt for a ticket: paid wins, else the newest one still open
      forRegistration: async (registrationId) =>
        (await payments.findOne({ registrationId, status: "paid" })) ||
        (await payments.find({ registrationId }).sort({ createdAt: -1 }).limit(1).next()),
      update: (id, patch) => payments.findOneAndUpdate({ _id: oid(id) }, { $set: patch }, { returnDocument: "after" }),
      list: ({ eventId, status } = {}) =>
        payments
          .find({ ...(eventId ? { eventId } : {}), ...(status ? { status } : {}) })
          .sort({ createdAt: -1 })
          .limit(2000)
          .toArray(),
    },

    users: {
      create: async (doc) => {
        const r = await users.insertOne(doc);
        return { _id: r.insertedId, ...doc };
      },
      get: (id) => (isOid(id) ? users.findOne({ _id: oid(id) }) : null),
      byPhone: (phone) => users.findOne({ phone }),
      update: (id, patch) => users.findOneAndUpdate({ _id: oid(id) }, { $set: patch }, { returnDocument: "after" }),
      list: ({ role, q, limit = 500 } = {}) => {
        const rx = q ? new RegExp(q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"), "i") : null;
        return users
          .find({
            ...(role ? { role } : {}),
            ...(rx ? { $or: [{ name: rx }, { phone: rx }, { email: rx }, { business: rx }] } : {}),
          })
          .sort({ createdAt: -1 })
          .limit(limit)
          .toArray();
      },
      count: () => users.countDocuments(),
    },

    // one document ("site") for the whole site; whatever was never set falls through to the defaults
    settings: {
      get: async () => {
        const { _id, ...doc } = (await settings.findOne({ _id: "site" })) || {};
        return { ...SITE_DEFAULTS, ...doc };
      },
      set: async (patch) => {
        const { _id, ...doc } = await settings.findOneAndUpdate(
          { _id: "site" },
          { $set: patch },
          { upsert: true, returnDocument: "after" }
        );
        return { ...SITE_DEFAULTS, ...doc };
      },
    },
  };
}
