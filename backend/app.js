import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { connect } from "./db.js";
import { eventsRouter } from "./routes/events.js";
import { interestRouter, registrationsRouter } from "./routes/registrations.js";
import { adminRouter } from "./routes/admin.js";
import { settingsRouter } from "./routes/settings.js";
import { authRouter } from "./routes/auth.js";
import { meRouter } from "./routes/me.js";
import { payRouter } from "./routes/pay.js";
import { adminGalleryRouter, galleryRouter } from "./routes/gallery.js";
import { uploadsRouter } from "./routes/uploads.js";
import { attachUser } from "./lib/session.js";

/* The app, with no opinion about how it is served: `npm start` gives it a port,
   Vercel hands it one request at a time. Serverless keeps the store between
   invocations of a warm instance, so the connection is made once and cached. */

const dist = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../dist");

export async function createApp({ serveStatic = true } = {}) {
  const store = await connect(process.env.MONGODB_URI);

  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);
  app.locals.store = store;

  app.use(express.json({ limit: "32kb" }));
  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
    next();
  });

  app.use(attachUser(store));

  // `demo` lets the login page offer one-tap sign-in while the fake data is loaded
  app.get("/api/health", (req, res) =>
    res.json({
      ok: true,
      store: store.kind,
      demo: process.env.DEMO_DATA === "1",
      demoStaff: process.env.DEMO_DATA === "1" && !process.env.ADMIN_KEY,
      time: new Date().toISOString(),
    })
  );
  app.use("/api/auth", authRouter);
  app.use("/api/me", meRouter);
  app.use("/api/pay", payRouter);
  app.use("/api/events", eventsRouter);
  app.use("/api/registrations", registrationsRouter);
  app.use("/api/interest", interestRouter);
  app.use("/api/settings", settingsRouter);
  app.use("/api/gallery", galleryRouter);
  app.use("/api/admin/gallery", adminGalleryRouter);
  app.use("/api/admin", adminRouter);
  app.use("/api", (req, res) => res.status(404).json({ error: "Not found" }));

  app.use("/uploads", uploadsRouter);

  // running as one process: serve the built site too, with the SPA paths falling back to it
  if (serveStatic) {
    app.use(express.static(dist, { maxAge: "1h" }));
    app.get(/.*/, (req, res) => {
      res.sendFile(path.join(dist, "index.html"), (err) => {
        if (err) res.status(404).type("text").send("Build the site first: npm run build");
      });
    });
  }

  // eslint-disable-next-line no-unused-vars
  app.use((err, req, res, next) => {
    const status = err.status || (err.type === "entity.parse.failed" ? 400 : 500);
    if (status >= 500) console.error(err);
    res.status(status).json({
      error: status >= 500 ? "Something went wrong on our side" : err.message,
      details: err.details,
    });
  });

  if (!process.env.ADMIN_KEY) {
    console.warn("[auth] ADMIN_KEY is not set — /admin and /api/admin are OPEN to anyone who can reach this server.");
  }
  return { app, store };
}
