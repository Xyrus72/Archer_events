import { connect, seedEvents } from "./db.js";

/* npm run seed — upserts the events in data/seed-events.js */
const store = await connect(process.env.MONGODB_URI);
if (store.kind !== "mongo") {
  console.error("Set MONGODB_URI in .env before seeding — the in-memory store seeds itself on every start.");
  process.exit(1);
}
const n = await seedEvents(store);
console.log(`[seed] ${n} event(s) created, the rest already existed.`);
await store.close();
