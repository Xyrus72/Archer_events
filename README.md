# Archer Events

The Archer Events site: a retro-vintage single page (React + Vite + Tailwind, GSAP motion)
with a small Express + MongoDB backend for event registrations and a staff-only ticket office.

## Run it

```bash
npm install
cp backend/.env.example backend/.env   # fill in MONGODB_URI and ADMIN_KEY when ready
npm run dev:full          # Vite on :5174 + API on :4000, together
```

- `npm run dev` — site only (Vite). `/api` is proxied to `:4000`.
- `npm run server` — API only, restarts on change.
- `npm run seed` — writes the events in `backend/data/seed-events.js` into MongoDB (skips ones that exist).
- `npm run build && npm start` — production: the API serves the built site from `dist/`.

Without `MONGODB_URI` the API runs on an in-memory store (seeded, resets on restart), so the
whole site works locally before the database is wired up.

## How registration works

Events live in MongoDB and the site reads them: the ticket card shows whatever is next on the
calendar, and the register modal lists every published event with registration open.

- **Festivals / melas** take two kinds of registration: **visitor** and **stall vendor**
  (stall bookings need a store name). The kind of event decides this; the ticket office can
  override it per event.
- **Everything else** (concerts, corporate, weddings, activations, themed nights) takes
  visitors only, so the role picker never shows.
- Each registration gets a ticket code like `ARC-7F3KQ2`. Registering twice with the same
  phone number for the same event and role returns the existing ticket instead of a duplicate.
- With nothing on the calendar, the card turns into "get first dibs" and collects interest.
- Phone numbers are validated as Bangladeshi mobiles and stored as `+8801XXXXXXXXX`.
- Besides name and phone, the form asks for age range, gender (optional), where they're coming
  from, how they heard about the event, party size (visitors) and product category (stalls) —
  the answer sets live in `shared/options.js` and feed the ticket-office charts.

## The look

The site is a printed poster: five inks (cream, terracotta, burnt orange, sage olive,
dark brown), a layered border frame around the whole sheet (`.poster-frame`), a flat sun,
and an illustrated silhouette band — a mela stall, a reception hall and a stage — drawn as
scalable SVG in `src/components/scene/`. Nothing is distressed; retro here means the
printing, not the wear.

The hero film *is* the artwork — a flat retro poster animation that plays at full strength,
with a cream scrim over its upper half so the headline always has paper under it. Where the
film will not play (reduced motion, a stalled load) the SVG scene stands in for it. To
replace the film, follow [docs/hero-video-prompt.md](docs/hero-video-prompt.md) and drop the
result in as `public/hero.mp4`.

## Accounts

Everyone signs in at `/login` with a phone number and password — one door for all three roles:

- **Visitors** and **stall owners** land on `/account`: their tickets and stall bookings with
  the codes, one-tap register for what's next (prefilled), profile and password.
- **Staff** land on `/admin`. The admin's own login screen also takes a staff account (or the
  `ADMIN_KEY`), and its **Users** screen lists everyone with an account and changes roles.

Tickets registered with a phone number are claimed by the account that later uses it, so
nothing registered before signing up is lost.

Passwords are scrypt-hashed (`node:crypto`), the session is a signed HttpOnly cookie
(`SESSION_SECRET` in `.env` — unset means everyone is signed out on restart), logins are
generic on failure and rate-limited per number.

With `DEMO_DATA=1` three accounts exist to try: `01711111111` / `archer123` (visitor),
`01722222222` / `archer123` (stall owner), `01700000000` / `admin123` (staff).

| Method | Path | What |
| --- | --- | --- |
| POST | `/api/auth/register` | `{ role: visitor\|stall, name, phone, password, email?, business? }` |
| POST | `/api/auth/login` | `{ phone, password }` |
| POST | `/api/auth/logout` | ends the session |
| GET/PATCH | `/api/auth/me` | who is signed in / edit name, email, store |
| POST | `/api/auth/password` | `{ current, next }` |
| GET | `/api/me/registrations` | that person's tickets |
| PATCH | `/api/me/registrations/:id` | `{ status: "cancelled" }` on their own ticket |

## Payments

Events carry a price (`pricing.visitor`, `pricing.stall`, both editable in the ticket office;
`0` means free and the checkout is skipped). A signed-in guest pays from `/account` or straight
from the registration confirmation: pick bKash, Nagad or card, land on `/pay/<ref>`, and paying
confirms the seat.

The gateway is pluggable and currently **sandbox** — a local imitation of the wallet screen that
moves no money and accepts any 5-digit PIN. Point `PAYMENT_GATEWAY` at a real provider and fill in
the start/verify halves of `backend/routes/pay.js`; nothing else in the app has to change.

| Method | Path | What |
| --- | --- | --- |
| POST | `/api/pay/registrations/:id/checkout` | `{ method }` → payment + `checkoutUrl` |
| GET | `/api/pay/:ref` | the guest's own payment |
| POST | `/api/pay/:ref/confirm` | sandbox confirm (`{ pin }` for wallets) |
| POST | `/api/pay/:ref/cancel` | abandon it |
| POST | `/api/admin/registrations/:id/payment` | staff settle up: `{ action: "mark-paid"\|"refund", method, txnId, note }` |
| POST | `/api/admin/registrations/:id/checkin` | gate check-in (`{ undo: true }` reverses it) |

## Ticket office

The admin at `/admin` deliberately does not look like the public site: it uses the FlexTag
dashboard language (deep navy, purple/cyan accent, Inter), scoped under `.fx` in
`src/styles/admin*.css`, with a light/dark toggle.

`/admin` — enter `ADMIN_KEY` (with `ADMIN_KEY` empty the office is **open**, no login — fine on
your laptop, not on a server). Set `DEMO_DATA=1` to fill the in-memory store with fake
registrations and explore every chart. An overview strip (upcoming events, registered, heads expected,
stalls, last 7 days, waiting list), then per event:

- **Stats** — registered / heads / stalls / confirmed share / last 24h / days to go, capacity
  fill, registrations per day, age range, how they heard about it, where they're coming from,
  gender, party size, what the stalls sell, and time-of-day of sign-ups.
- **Moments** — the photo strip on the home page: add a tile, upload a JPEG/PNG/WebP (up to
  6 MB), caption it, set a category, reorder, show or hide. Photos land in `uploads/`
  (git-ignored) and are served from `/uploads`; deleting a tile deletes its file.
- **Registrations** — the list, filterable by role and status; confirm, cancel, export CSV;
  **take payment at the desk** (cash, bKash, Nagad or card, with a reference), **refund**, and
  **check people in at the gate**.
- **Edit** — dates, venue, kind, publish, open/close registration, stall bookings, capacities.

Staff can also edit the homepage stats strip (`120+ events · 300K+ guests · 12 cities`) from the
office — one to four value/label pairs, live on the site as soon as they're saved.

## API

| Method | Path | What |
| --- | --- | --- |
| GET | `/api/events` | `{ upcoming, past }` — published events, Dhaka time |
| GET | `/api/events/:slug` | one event |
| POST | `/api/registrations` | `{ event, role, name, phone, email?, business?, guests?, note? }` → ticket |
| GET | `/api/registrations/:code` | look a ticket up |
| POST | `/api/interest` | `{ name, phone, email?, note? }` |
| GET | `/api/settings` | `{ settings: { heroStats } }` — the homepage stats strip |
| GET/PUT | `/api/admin/settings` | read / replace site settings: `{ heroStats: [{ value, label }] }`, 1–4 pairs |
| GET | `/api/admin/overview` | calendar-wide numbers (`Authorization: Bearer ADMIN_KEY`) |
| GET | `/api/admin/events/:id/stats` | per-event stats: totals, capacity, timeline, age, source, area, gender, party, category, hours |
| GET/POST/PATCH/DELETE | `/api/admin/events[/:id]` | manage events |
| GET/PATCH | `/api/admin/registrations[/:id]` | list (`?event=&role=&status=`), set status |
| GET | `/api/admin/registrations.csv` | export |
| GET | `/api/admin/interest` | the waiting list |
| GET | `/api/gallery` | published photo tiles for the home page |
| GET/POST/PATCH/DELETE | `/api/admin/gallery[/:id]` | manage tiles |
| PUT | `/api/admin/gallery/:id/image` | the photo itself — raw image bytes as the body |

Validation errors come back as `400 { error, details: { field: message } }`. Public POSTs are
rate-limited per IP.

## Layout

```
backend/           Express API — its own package; see backend/README.md
src/components/    Logo (the crest, pure vector), Hero, Services, Countdown (ticket card),
                   Showcase, RegisterModal, Admin (ticket office), Ornaments
src/styles/        theme tokens (global.css), shared chrome
```
