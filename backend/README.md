# Archer Events — backend

The API behind the site and the ticket office: **Express 5 + the official MongoDB driver**,
nothing else. No ORM, no auth library, no upload middleware — passwords, sessions, rate limits,
validation and image checks are written against Node's standard library, so there is little to
patch and nothing hidden.

**MongoDB is optional for now.** With `MONGODB_URI` blank the API runs on an in-memory store
with exactly the same interface, so everything works end to end — it just forgets on restart.
Paste the connection string into `.env` when you have it and the same code talks to Mongo.

## Run it

From the repo root (Vite on :5174 and the API on :4000 together):

```bash
npm run dev:full
```

Or the backend on its own:

```bash
cd backend
cp .env.example .env
npm install
npm run dev
```

| Script | What it does |
| --- | --- |
| `npm run dev` | API with `--watch`, restarts on change |
| `npm start` | API, no watching (production) |
| `npm test` | the end-to-end suite in `tests/` against the in-memory store |
| `npm run seed` | writes `data/seed-events.js` into MongoDB (skips events that exist) |
| `npm run admin:create -- --name "…" --phone 01XXXXXXXXX --password "…"` | makes a staff account, or promotes the one on that number |

`seed` and `admin:create` refuse to run without `MONGODB_URI` — writing either to the in-memory
store would vanish the moment the script exits.

## Environment

See [`.env.example`](.env.example). The ones that matter:

| Variable | Why |
| --- | --- |
| `MONGODB_URI` | **blank for now.** Set it and data persists. |
| `ADMIN_KEY` | Empty = the ticket office is open to anyone. Set a long random string before going live. |
| `SESSION_SECRET` | Signs the login cookie. Unset = everyone is signed out on every restart. |
| `DEMO_DATA` | `1` fills the in-memory store with fake events, registrations and one-tap demo logins. |

## Layout

```
backend/
  index.js          starts the server (npm start / npm run dev)
  app.js            builds the Express app — shared by index.js and the Vercel function (../api)
  db.js             picks MongoDB or the in-memory store, seeds events
  routes/           one router per area: events, registrations, auth, me, pay, admin, gallery,
                    settings, uploads
  lib/              validation, sessions + passwords, admin gate, rate limits, stats, image checks
  store/            memory.js and mongo.js — the same interface, so routes never know which is live
  shared/           answer sets and payment vocabulary, imported by the frontend too
  data/             seed events, homepage defaults
  demo.js           fake data for DEMO_DATA=1 (memory store only)
  scripts/          create-admin.js
  tests/            node:test suite
```

## What it does

- **Events** — public calendar; festivals take visitor + stall registrations, everything else
  visitors only. Staff create, edit, price, open and close them.
- **Registrations** — ticket codes (`ARC-XXXXXX`), duplicate-proof per phone/event/role,
  Bangladeshi phone validation, age / area / source / party-size answers for the stats.
- **Accounts** — visitors, stall owners and staff on one login. scrypt passwords, signed
  HttpOnly session cookie, generic failures, per-number lockout, JSON-only guard.
- **Payments** — bKash / Nagad / card checkout through a **sandbox** gateway (moves no money);
  staff can also take cash at the desk, refund, and check guests in at the gate. A real provider
  plugs into `routes/pay.js` without touching the rest.
- **Ticket office** — overview and per-event stats, registrations with CSV export, users and
  roles, the waiting list, homepage stats, and the "Moments" photo strip.
- **Photos** — uploaded as raw bytes, checked by their actual contents (JPEG / PNG / WebP,
  6 MB cap), stored in the database and served with immutable caching. No disk, so it works the
  same on a serverless host.

The full endpoint list is in the [root README](../README.md).
