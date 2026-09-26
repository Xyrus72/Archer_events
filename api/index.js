import { createApp } from "../backend/app.js";

/* Vercel entry. The whole app is one function; Vercel serves dist/ itself, so the
   static half is switched off here. A warm instance keeps its database connection. */

let ready;
export default async function handler(req, res) {
  ready ??= createApp({ serveStatic: false }).then(({ app }) => app);
  const app = await ready;
  return app(req, res);
}
