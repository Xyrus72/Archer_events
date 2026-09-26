import { spawn } from "node:child_process";

/* Runs the Vite dev server and the API side by side, no extra tooling. */
const npm = process.platform === "win32" ? "npm.cmd" : "npm";
const run = (script) =>
  spawn(npm, ["run", script], { stdio: "inherit", shell: process.platform === "win32" });

const procs = [run("dev"), run("server")];
const stop = () => procs.forEach((p) => p.kill());
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
procs.forEach((p) => p.on("exit", (code) => code && stop()));
