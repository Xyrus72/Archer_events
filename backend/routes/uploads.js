import { Router } from "express";
import { notFound } from "../lib/http.js";

/* Serving a photograph back out. Names are unique per upload, so the answer can be
   cached hard and forever — replacing a picture mints a new name. */

export const uploadsRouter = Router();

uploadsRouter.get("/:name", async (req, res) => {
  const f = await req.app.locals.store.files.get(String(req.params.name));
  if (!f) throw notFound("No such file");
  res.setHeader("Content-Type", f.type || "application/octet-stream");
  res.setHeader("Cache-Control", "public, max-age=31536000, immutable");
  res.setHeader("Content-Length", String(f.data.length));
  res.end(f.data);
});
