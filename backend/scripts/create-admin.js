import { connect } from "../db.js";
import { hashPassword } from "../lib/session.js";
import { normalizePhone } from "../lib/validate.js";

/* npm run admin:create -- --name "Rafi Ahmed" --phone 01712345678 --password "long-secret"

   Makes a staff account, or promotes (and re-passwords) whoever already holds that number.
   It only means something against MongoDB: an admin written to the in-memory store would
   vanish the moment this script exits. */

const args = {};
const argv = process.argv.slice(2);
for (let i = 0; i < argv.length; i += 1) {
  if (argv[i].startsWith("--")) args[argv[i].slice(2)] = argv[i + 1];
}

const fail = (message) => {
  console.error(`[admin:create] ${message}`);
  process.exit(1);
};

const name = String(args.name || "").trim();
const phone = normalizePhone(args.phone);
const password = String(args.password || "");

if (!process.env.MONGODB_URI) fail("Set MONGODB_URI in backend/.env first — there is nowhere durable to put the account yet.");
if (!phone) fail("--phone must be a Bangladeshi mobile number, e.g. 01712345678");
if (password.length < 8 || password.length > 72) fail("--password must be 8 to 72 characters");

const store = await connect(process.env.MONGODB_URI);
const existing = await store.users.byPhone(phone);

if (existing) {
  await store.users.update(String(existing._id), {
    role: "admin",
    passwordHash: hashPassword(password),
    ...(name ? { name } : {}),
    updatedAt: new Date(),
  });
  console.log(`[admin:create] ${name || existing.name} (${phone}) is staff now; password reset.`);
} else {
  if (name.length < 2) fail("--name is required when the number has no account yet");
  await store.users.create({
    role: "admin",
    name,
    phone,
    email: "",
    business: "",
    passwordHash: hashPassword(password),
    createdAt: new Date(),
    lastLoginAt: null,
  });
  console.log(`[admin:create] staff account created for ${name} (${phone}).`);
}

await store.close();
