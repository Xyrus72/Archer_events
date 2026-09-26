import { Router } from "express";
import { Form } from "../lib/validate.js";
import { rateLimit } from "../lib/ratelimit.js";
import { bad, HttpError } from "../lib/http.js";
import {
  clearSessionCookie,
  hashPassword,
  jsonOnly,
  publicUser,
  requireUser,
  setSessionCookie,
  verifyPassword,
} from "../lib/session.js";

export const authRouter = Router();
authRouter.use(jsonOnly);

const ROLES = ["visitor", "stall"];

/* password rules live here so register and change-password agree */
function password(form, key = "password") {
  const v = typeof form.body[key] === "string" ? form.body[key] : "";
  if (!v) form.errors[key] = "Required";
  else if (v.length < 8) form.errors[key] = "At least 8 characters";
  else if (v.length > 72) form.errors[key] = "At most 72 characters";
  else form.data[key] = v;
  return form;
}

authRouter.post("/register", rateLimit({ windowMs: 15 * 60_000, max: 10 }), async (req, res) => {
  const store = req.app.locals.store;
  const f = new Form(req.body)
    .oneOf("role", ROLES, { fallback: "visitor" }) // never "admin": staff are made by staff
    .text("name", { required: true, min: 2, max: 80 })
    .phone("phone")
    .email("email")
    .text("business", { max: 80 });
  password(f);
  if (f.data.role === "stall" && !f.data.business) f.errors.business = "Tell us your store or brand name";
  const d = f.done();

  const doc = {
    role: d.role,
    name: d.name,
    phone: d.phone,
    email: d.email,
    business: d.role === "stall" ? d.business : "",
    passwordHash: hashPassword(d.password),
    createdAt: new Date(),
    lastLoginAt: new Date(),
  };

  let user;
  try {
    user = await store.users.create(doc);
  } catch (err) {
    if (err.code !== 11000) throw err;
    throw new HttpError(409, "That number already has an account");
  }
  // tickets already registered with this number become theirs
  await store.registrations.claim?.(user.phone, String(user._id));
  setSessionCookie(req, res, user);
  res.status(201).json({ user: publicUser(user) });
});

/* wrong tries are counted per IP+phone so one account cannot be ground down */
const misses = new Map();
const WINDOW = 15 * 60_000;
setInterval(() => {
  const now = Date.now();
  for (const [k, m] of misses) if (m.reset < now) misses.delete(k);
}, WINDOW).unref();

authRouter.post("/login", async (req, res) => {
  const store = req.app.locals.store;
  // a number that is not a number at all is a typo, not a failed guess: say so plainly.
  // (Whether an account *exists* stays secret — that is what the generic 401 below is for.)
  const f = new Form(req.body).phone("phone", { required: true });
  if (f.errors.phone) throw bad("Check the highlighted fields", { phone: f.errors.phone });
  const phone = f.data.phone;
  const key = `${req.ip}|${phone}`;
  const now = Date.now();
  const m = misses.get(key);
  if (m && m.reset > now && m.count >= 10) {
    return res.status(429).json({ error: "Too many attempts — try again in a few minutes" });
  }

  const user = await store.users.byPhone(phone);
  const password = typeof req.body?.password === "string" ? req.body.password : "";
  // verify even when the phone is unknown, so a miss costs the same either way
  if (!verifyPassword(password, user?.passwordHash) || !user) {
    const rec = m && m.reset > now ? m : { count: 0, reset: now + WINDOW };
    rec.count += 1;
    misses.set(key, rec);
    return res.status(401).json({ error: "Wrong phone number or password" });
  }

  misses.delete(key);
  await store.users.update(String(user._id), { lastLoginAt: new Date() });
  setSessionCookie(req, res, user);
  res.json({ user: publicUser(user) });
});

authRouter.post("/logout", async (req, res) => {
  // revoke on the server too, so a copied or stale cookie (other tab, other device) stops working
  if (req.user) {
    await req.app.locals.store.users.update(String(req.user._id), {
      sessionVersion: (req.user.sessionVersion || 0) + 1,
      updatedAt: new Date(),
    });
  }
  clearSessionCookie(req, res);
  res.json({ ok: true });
});

authRouter.get("/me", (req, res) => res.json({ user: publicUser(req.user) || null }));

authRouter.patch("/me", requireUser, async (req, res) => {
  const store = req.app.locals.store;
  const f = new Form(req.body).text("name", { required: true, min: 2, max: 80 }).email("email").text("business", { max: 80 });
  if (req.user.role === "stall" && !f.data.business) f.errors.business = "Tell us your store or brand name";
  const d = f.done();
  // role and phone are identity: they never move through this route
  const user = await store.users.update(String(req.user._id), {
    name: d.name,
    email: d.email,
    business: req.user.role === "stall" ? d.business : "",
  });
  res.json({ user: publicUser(user) });
});

authRouter.post("/password", requireUser, async (req, res) => {
  const store = req.app.locals.store;
  const f = new Form(req.body);
  password(f, "next");
  const d = f.done();
  const current = typeof req.body?.current === "string" ? req.body.current : "";
  if (!verifyPassword(current, req.user.passwordHash)) {
    throw bad("Current password is wrong", { current: "Wrong password" });
  }
  await store.users.update(String(req.user._id), { passwordHash: hashPassword(d.next) });
  res.json({ ok: true });
});
