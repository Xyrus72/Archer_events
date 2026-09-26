import { randomBytes } from "node:crypto";
import { HttpError } from "./http.js";

/* Photographs live in the database next to everything else. That costs a little
   space and buys a lot: no bucket to configure, no second set of credentials, and
   the site runs the same on a rented box as it does on a serverless host, where a
   file written to disk would not survive the next request. */

export const MAX_BYTES = 6 * 1024 * 1024;

/* trust the bytes, never the Content-Type a client claims */
const KINDS = [
  { ext: "jpg", type: "image/jpeg", test: (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", type: "image/png", test: (b) => b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47 },
  {
    ext: "webp",
    type: "image/webp",
    test: (b) => b.toString("latin1", 0, 4) === "RIFF" && b.toString("latin1", 8, 12) === "WEBP",
  },
];

export function sniff(buf) {
  if (!buf || buf.length < 16) throw new HttpError(400, "That file is empty");
  const kind = KINDS.find((k) => k.test(buf));
  if (!kind) throw new HttpError(415, "Use a JPEG, PNG or WebP photo");
  return kind;
}

export async function saveImage(store, buf) {
  if (buf.length > MAX_BYTES) throw new HttpError(413, "Keep photos under 6 MB");
  const kind = sniff(buf);
  // the name carries the extension so the URL still looks like a picture
  const name = `${Date.now().toString(36)}-${randomBytes(6).toString("hex")}.${kind.ext}`;
  await store.files.put({ name, type: kind.type, bytes: buf.length, data: buf, createdAt: new Date() });
  return { file: name, url: `/uploads/${name}`, bytes: buf.length, type: kind.type };
}

/* a missing file is already the state we wanted */
export async function removeImage(store, file) {
  if (!file) return;
  await store.files.remove(file).catch(() => {});
}
