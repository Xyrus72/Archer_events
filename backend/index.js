import { createApp } from "./app.js";

/* One long-lived process, the way it runs locally and on any normal host. */
const PORT = Number(process.env.PORT) || 4000;
const { app, store } = await createApp();
app.listen(PORT, () => console.log(`[api] Archer Events API on http://localhost:${PORT} (${store.kind})`));
