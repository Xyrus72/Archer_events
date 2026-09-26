import { bad } from "./http.js";

export const clean = (v, max = 200) =>
  typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, max) : "";

export const slugify = (s) =>
  clean(s, 80)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/* Bangladeshi mobile: 01[3-9]XXXXXXXX with optional +88/88 → stored as +8801XXXXXXXXX */
export function normalizePhone(v) {
  const digits = String(v || "").replace(/\D/g, "");
  const m = digits.match(/^(?:88)?(01[3-9]\d{8})$/);
  return m ? `+88${m[1]}` : null;
}

export const isEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);

/* Collects field errors and throws one 400 carrying all of them. */
export class Form {
  constructor(body) {
    this.body = body && typeof body === "object" ? body : {};
    this.errors = {};
    this.data = {};
  }

  text(key, { required = false, min = 0, max = 200 } = {}) {
    const v = clean(this.body[key], max + 1);
    if (!v) {
      if (required) this.errors[key] = "Required";
      else this.data[key] = "";
    } else if (v.length < min) this.errors[key] = `At least ${min} characters`;
    else if (v.length > max) this.errors[key] = `At most ${max} characters`;
    else this.data[key] = v;
    return this;
  }

  phone(key, { required = true } = {}) {
    const raw = clean(this.body[key], 40);
    if (!raw) {
      if (required) this.errors[key] = "Required";
      else this.data[key] = "";
      return this;
    }
    const p = normalizePhone(raw);
    if (!p) this.errors[key] = "Use a Bangladeshi mobile number, e.g. 01712-345678";
    else this.data[key] = p;
    return this;
  }

  email(key, { required = false } = {}) {
    const v = clean(this.body[key], 120).toLowerCase();
    if (!v) {
      if (required) this.errors[key] = "Required";
      else this.data[key] = "";
    } else if (!isEmail(v)) this.errors[key] = "That email doesn't look right";
    else this.data[key] = v;
    return this;
  }

  int(key, { min = 0, max = 1e9, fallback = null } = {}) {
    const raw = this.body[key];
    if (raw === undefined || raw === null || raw === "") {
      this.data[key] = fallback;
      return this;
    }
    const n = Number(raw);
    if (!Number.isInteger(n) || n < min || n > max) this.errors[key] = `Must be a whole number between ${min} and ${max}`;
    else this.data[key] = n;
    return this;
  }

  date(key, { required = false } = {}) {
    const raw = this.body[key];
    if (!raw) {
      if (required) this.errors[key] = "Required";
      else this.data[key] = null;
      return this;
    }
    const d = new Date(raw);
    if (Number.isNaN(d.getTime())) this.errors[key] = "Not a valid date";
    else this.data[key] = d;
    return this;
  }

  bool(key, fallback = false) {
    const raw = this.body[key];
    this.data[key] = raw === undefined || raw === null ? fallback : raw === true || raw === "true" || raw === 1;
    return this;
  }

  oneOf(key, options, { required = false, fallback = null } = {}) {
    const v = clean(this.body[key], 40);
    if (!v) {
      if (required) this.errors[key] = "Required";
      else this.data[key] = fallback;
    } else if (!options.includes(v)) this.errors[key] = `Must be one of: ${options.join(", ")}`;
    else this.data[key] = v;
    return this;
  }

  /* a list of objects, each checked by `item(form)`; item errors are keyed "key.index.field" */
  list(key, item, { min = 0, max = 100 } = {}) {
    const raw = this.body[key];
    if (!Array.isArray(raw)) this.errors[key] = "Must be a list";
    else if (raw.length < min || raw.length > max) this.errors[key] = `Between ${min} and ${max} items`;
    else {
      this.data[key] = raw.map((row, i) => {
        const f = item(new Form(row));
        for (const [field, msg] of Object.entries(f.errors)) this.errors[`${key}.${i}.${field}`] = msg;
        return f.data;
      });
    }
    return this;
  }

  done() {
    if (Object.keys(this.errors).length) throw bad("Check the highlighted fields", this.errors);
    return this.data;
  }
}
