/* Real events on the calendar. Dates are Dhaka time (+06). Slug is the stable id. */
export const SEED_EVENTS = [
  {
    slug: "offline-mela",
    title: "Offline Mela",
    kind: "festival",
    tagline: "Your favourite online stores, in person.",
    description:
      "One day. Real people. Real connections. Dhaka's online sellers set up shop in the real world — browse, try, and buy from the brands you follow.",
    venue: "Gulshan",
    city: "Dhaka",
    startsAt: new Date("2026-09-05T13:00:00+06:00"),
    endsAt: new Date("2026-09-05T21:00:00+06:00"),
    pricing: { visitor: 0, stall: 3000 },
    registration: {
      open: true,
      roles: ["visitor", "stall"],
      stallInfo: "Stalls include two 4ft x 2ft tables (about 30 sq ft) for product display.",
      capacity: 0,
      stallCapacity: 0,
    },
    published: true,
    featured: true,
  },
];
