import { randomInt } from "node:crypto";

/* ticket codes like ARC-7F3KQ2 — no 0/O or 1/I, so they survive being read out loud */
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export const makeCode = () =>
  "ARC-" + Array.from({ length: 6 }, () => ALPHABET[randomInt(ALPHABET.length)]).join("");
