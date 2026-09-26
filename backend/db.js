import { memoryStore } from "./store/memory.js";
import { mongoStore } from "./store/mongo.js";
import { SEED_EVENTS } from "./data/seed-events.js";
import { seedDemo } from "./demo.js";

/* Upserts the seed events by slug; safe to run repeatedly. */
export async function seedEvents(store) {
  let created = 0;
  for (const e of SEED_EVENTS) {
    if (await store.events.get(e.slug)) continue;
    await store.events.create({ ...e, createdAt: new Date(), updatedAt: new Date() });
    created += 1;
  }
  return created;
}

export async function connect(uri) {
  if (uri) {
    const store = await mongoStore(uri);
    console.log(`[db] connected to MongoDB (${store.dbName})`);
    return store;
  }
  const store = memoryStore();
  await seedEvents(store);
  console.warn("[db] MONGODB_URI is not set — using an in-memory store. Data resets on restart.");
  if (process.env.DEMO_DATA === "1") {
    const n = await seedDemo(store);
    console.warn(`[db] DEMO_DATA=1 — ${n} fake registrations loaded so the ticket office has something to show.`);
  }
  return store;
}
