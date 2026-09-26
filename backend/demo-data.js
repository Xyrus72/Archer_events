/* Ingredients for the fake-but-plausible demo data (see demo.js). Deterministic PRNG so every boot looks the same. */

let seed = 20260905;
export const rnd = () => {
  seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
};

/* weighted pick */
export const pick = (arr, weights) => {
  if (!weights) return arr[Math.floor(rnd() * arr.length)];
  let r = rnd() * weights.reduce((a, b) => a + b, 0);
  for (let i = 0; i < arr.length; i += 1) if ((r -= weights[i]) < 0) return arr[i];
  return arr[arr.length - 1];
};

export const FIRST = ["Rafi", "Nusrat", "Tanvir", "Sadia", "Mehedi", "Farzana", "Arif", "Sumaiya", "Imran", "Lamia", "Shakib", "Nabila", "Rakib", "Tasnim", "Fahim", "Jannat", "Omar", "Mim", "Adnan", "Priya", "Sabbir", "Rifat", "Maliha", "Tahmid", "Anika", "Zubair", "Ishrat", "Nafis", "Raisa", "Hasib"];
export const LAST = ["Ahmed", "Jahan", "Hasan", "Islam", "Akter", "Chowdhury", "Rahman", "Kabir", "Hossain", "Khan", "Noor", "Uddin", "Ara", "Siddique", "Ferdous", "Faruk", "Das", "Sultana", "Mahmud", "Karim"];
export const SHOPS = ["Threads", "Kitchen", "Studio", "Crafts", "Ceramics", "Bakes", "Botanicals", "Books", "Gadgets", "Jewels", "Home", "Spice Co"];
export const NOTES = ["", "", "", "Coming with family", "Is there parking?", "Wheelchair access needed", "Will arrive late", "First time!", "Need a power socket", "Corner stall if possible"];

const reg = (open, roles, stallInfo, capacity, stallCapacity) => ({ open, roles, stallInfo, capacity, stallCapacity });

export const DEMO_EVENTS = [
  { slug: "winter-mela", title: "Winter Mela", kind: "festival", tagline: "Dhaka's makers, under one roof.", description: "Sixty stalls, live music and winter food. The mela everyone waits for.", venue: "Gulshan Club", city: "Dhaka", startsAt: new Date("2026-12-12T11:00:00+06:00"), endsAt: new Date("2026-12-12T21:00:00+06:00"), pricing: { visitor: 0, stall: 3500 }, registration: reg(true, ["visitor", "stall"], "Two 4ft x 2ft tables (about 30 sq ft) per stall.", 400, 40), published: true, featured: true },
  { slug: "neon-nights-live", title: "Neon Nights Live", kind: "concert", tagline: "One night. All the lights.", description: "", venue: "ICCB Expo Zone", city: "Dhaka", startsAt: new Date("2026-11-20T19:00:00+06:00"), endsAt: null, pricing: { visitor: 1200, stall: 0 }, registration: reg(true, ["visitor"], "", 1200, 0), published: true, featured: false },
  { slug: "summit-26-keynote", title: "Summit '26 Keynote", kind: "corporate", tagline: "Where Dhaka's founders meet.", description: "", venue: "Radisson Blu", city: "Dhaka", startsAt: new Date("2026-10-15T10:00:00+06:00"), endsAt: new Date("2026-10-15T17:00:00+06:00"), pricing: { visitor: 2500, stall: 0 }, registration: reg(true, ["visitor"], "", 300, 0), published: true, featured: false },
  { slug: "masquerade-ball", title: "Masquerade Ball", kind: "themed", tagline: "Masks on. Names off.", description: "", venue: "Le Meridien", city: "Dhaka", startsAt: new Date("2027-01-30T20:00:00+06:00"), endsAt: null, pricing: { visitor: 1800, stall: 0 }, registration: reg(false, ["visitor"], "", 0, 0), published: false, featured: false },
];

/* [slug, visitors, stalls, days the sign-ups are spread over] */
export const DEMO_PLAN = [
  ["offline-mela", 64, 18, 32],
  ["winter-mela", 58, 14, 21],
  ["neon-nights-live", 47, 0, 14],
  ["summit-26-keynote", 22, 0, 9],
];
