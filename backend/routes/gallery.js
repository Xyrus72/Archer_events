import { Router } from "express";
import express from "express";
import { Form } from "../lib/validate.js";
import { notFound, serialize } from "../lib/http.js";
import { requireAdmin } from "../lib/auth.js";
import { MAX_BYTES, removeImage, saveImage } from "../lib/uploads.js";

/* "Moments we've made" — the work the office puts on the front page.
   The public router is read-only; everything that changes a tile is behind the office door. */

export const galleryRouter = Router();
export const adminGalleryRouter = Router();
adminGalleryRouter.use(requireAdmin);

const view = (g) => ({
  ...serialize(g),
  url: g.file ? `/uploads/${g.file}` : "",
});

galleryRouter.get("/", async (req, res) => {
  const rows = await req.app.locals.store.gallery.list({ publishedOnly: true });
  res.json({ gallery: rows.filter((g) => g.file).map(view) });
});

const form = (body) =>
  new Form(body)
    .text("title", { required: true, min: 2, max: 80 })
    .text("category", { max: 40 })
    .text("alt", { max: 160 })
    .bool("published", true)
    .int("order", { min: 0, max: 999, fallback: 0 })
    .done();

adminGalleryRouter.get("/", async (req, res) => {
  const rows = await req.app.locals.store.gallery.list({ publishedOnly: false });
  res.json({ gallery: rows.map(view) });
});

adminGalleryRouter.post("/", async (req, res) => {
  const store = req.app.locals.store;
  const d = form(req.body);
  const existing = await store.gallery.list({ publishedOnly: false });
  const g = await store.gallery.create({
    ...d,
    // new tiles land at the end unless the office says otherwise
    order: req.body?.order === undefined ? existing.length : d.order,
    file: "",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
  res.status(201).json({ item: view(g) });
});

adminGalleryRouter.patch("/:id", async (req, res) => {
  const store = req.app.locals.store;
  const d = form({ ...req.body, order: req.body?.order });
  const g = await store.gallery.update(req.params.id, { ...d, updatedAt: new Date() });
  if (!g) throw notFound("No such tile");
  res.json({ item: view(g) });
});

/* the photo itself: raw bytes on the wire, no multipart parser to keep patched */
adminGalleryRouter.put(
  "/:id/image",
  express.raw({ type: ["image/*", "application/octet-stream"], limit: MAX_BYTES }),
  async (req, res) => {
    const store = req.app.locals.store;
    const g = await store.gallery.get(req.params.id);
    if (!g) throw notFound("No such tile");
    const saved = await saveImage(store, req.body);
    await removeImage(store, g.file); // one tile, one photo kept
    const updated = await store.gallery.update(req.params.id, { file: saved.file, updatedAt: new Date() });
    res.json({ item: view(updated), bytes: saved.bytes });
  }
);

adminGalleryRouter.delete("/:id", async (req, res) => {
  const store = req.app.locals.store;
  const g = await store.gallery.get(req.params.id);
  if (!g) throw notFound("No such tile");
  await removeImage(store, g.file);
  await store.gallery.remove(req.params.id);
  res.json({ ok: true });
});
