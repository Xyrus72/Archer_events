import { useEffect, useRef, useState } from "react";

// Gold comet cursor trail (KIKK-inspired, upgraded).
// One SVG layer under the cursor dot/ring (z-300 vs 399/400), above grain (200):
//   halo   — soft blurred gradient polyline under the ribbon
//   ribbon — smooth variable-width polygon through 50 chained points,
//            screen-space gradient head→tail, width breathes with velocity
//   dust   — pooled gold particles emitted from the head while moving
//   rings  — click shockwaves
// Behavior: stretches when the cursor is fast, slims when slow, tightens and
// brightens over links/buttons, and after ~1.2s idle the comet lazily swims
// a small lissajous orbit around the cursor instead of freezing.

const SEGMENTS = 50;
const BASE_EASE = 0.55;
const BASE_WIDTH = 28;
const SVG_NS = "http://www.w3.org/2000/svg";
const RAMP = ["#a87a00", "#cf9700", "#eab200", "#ffd400", "#ffe66b"];
const HOT_RGB = [255, 223, 64];
const HOT_SELECTOR = "a, button, .show-tile, .svc-row";
const DUST_POOL = 90;
const RING_POOL = 4;

const hex = (s) => [parseInt(s.slice(1, 3), 16), parseInt(s.slice(3, 5), 16), parseInt(s.slice(5, 7), 16)];
const RAMP_RGB = RAMP.map(hex);
const mix = (a, b, f) =>
  `rgb(${Math.round(a[0] + (b[0] - a[0]) * f)},${Math.round(a[1] + (b[1] - a[1]) * f)},${Math.round(a[2] + (b[2] - a[2]) * f)})`;

const envAllows = () =>
  typeof window !== "undefined" &&
  window.matchMedia("(pointer: fine)").matches &&
  window.innerWidth >= 768 &&
  !window.matchMedia("(prefers-reduced-motion: reduce)").matches;

export default function CursorTrail() {
  const svgRef = useRef(null);
  const [active, setActive] = useState(envAllows);

  useEffect(() => {
    const update = () => setActive(envAllows());
    const fine = window.matchMedia("(pointer: fine)");
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("resize", update);
    fine.addEventListener("change", update);
    reduced.addEventListener("change", update);
    update();
    return () => {
      window.removeEventListener("resize", update);
      fine.removeEventListener("change", update);
      reduced.removeEventListener("change", update);
    };
  }, []);

  useEffect(() => {
    if (!active) return;
    const svg = svgRef.current;
    if (!svg) return;

    const uid = "trail-" + Math.random().toString(36).slice(2, 8);
    const el = (tag, attrs) => {
      const node = document.createElementNS(SVG_NS, tag);
      for (const k in attrs) node.setAttribute(k, attrs[k]);
      return node;
    };

    // Gradient in screen space, endpoints pinned to head/tail every frame.
    const defs = el("defs", {});
    const grad = el("linearGradient", { id: uid, gradientUnits: "userSpaceOnUse" });
    const stops = RAMP.map((c, i) => {
      const s = el("stop", { offset: `${(i / (RAMP.length - 1)) * 100}%`, "stop-color": c });
      grad.appendChild(s);
      return s;
    });
    defs.appendChild(grad);
    svg.appendChild(defs);

    const halo = el("path", {
      fill: "none", stroke: `url(#${uid})`, "stroke-opacity": "0.18",
      "stroke-linecap": "round", "stroke-linejoin": "round",
    });
    halo.style.filter = "blur(8px)";
    const ribbon = el("path", { fill: `url(#${uid})` });
    const head = el("circle", { fill: RAMP[0] });
    svg.appendChild(halo);
    svg.appendChild(ribbon);
    svg.appendChild(head);

    const dust = [];
    for (let i = 0; i < DUST_POOL; i++) {
      const c = el("circle", { r: "0", fill: RAMP[3] });
      svg.appendChild(c);
      dust.push({ el: c, x: 0, y: 0, vx: 0, vy: 0, life: 0, maxLife: 0, r0: 0 });
    }
    const rings = [];
    for (let i = 0; i < RING_POOL; i++) {
      const c = el("circle", { r: "0", fill: "none", stroke: RAMP[1], "stroke-opacity": "0" });
      svg.appendChild(c);
      rings.push({ el: c, x: 0, y: 0, prog: 1 });
    }

    const spawnDust = (x, y, speed, spread) => {
      const p = dust.find((d) => d.life <= 0);
      if (!p) return;
      const ang = Math.random() * Math.PI * 2;
      const v = speed * (0.4 + Math.random() * 0.6);
      p.x = x + (Math.random() - 0.5) * spread;
      p.y = y + (Math.random() - 0.5) * spread;
      p.vx = Math.cos(ang) * v;
      p.vy = Math.sin(ang) * v - 0.35;
      p.maxLife = p.life = 36 + Math.random() * 30;
      p.r0 = 1 + Math.random() * 1.7;
      p.el.setAttribute("fill", RAMP[2 + Math.floor(Math.random() * 3)]);
    };

    const mouse = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
    const pts = [];
    const normals = [];
    for (let i = 0; i < SEGMENTS; i++) {
      pts.push({ x: -1500, y: -750 });
      normals.push({ x: 0, y: 1 });
    }
    let idle = 999, hotF = 0, hotTarget = 0, vel = 0, emitAcc = 0, t = 0;
    let prevT = { x: mouse.x, y: mouse.y };

    const onMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      idle = 0;
      hotTarget = e.target && e.target.closest && e.target.closest(HOT_SELECTOR) ? 1 : 0;
    };
    const onDown = (e) => {
      const ring = rings.find((r) => r.prog >= 1) || rings[0];
      ring.x = e.clientX;
      ring.y = e.clientY;
      ring.prog = 0;
      for (let i = 0; i < 12; i++) spawnDust(e.clientX, e.clientY, 3, 6);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerdown", onDown);

    let raf;
    const tick = () => {
      t += 1 / 60;
      idle++;

      // Idle: swim a small lissajous orbit around the resting cursor.
      let tx = mouse.x, ty = mouse.y;
      if (idle > 70) {
        const k = Math.min(1, (idle - 70) / 90);
        tx += Math.cos(t * 1.1) * 18 * k;
        ty += Math.sin(t * 1.7) * 13 * k;
      }

      const d0 = Math.hypot(tx - prevT.x, ty - prevT.y);
      prevT.x = tx; prevT.y = ty;
      vel += (d0 - vel) * 0.12;
      hotF += (hotTarget - hotF) * 0.15;

      // Chain: head chases target, each point chases the one before it.
      const ease = BASE_EASE + hotF * 0.15;
      let target = { x: tx, y: ty };
      for (const p of pts) {
        p.x += (target.x - p.x) * ease;
        p.y += (target.y - p.y) * ease;
        target = p;
      }

      // Width: slim at rest, swells with speed, breathes when idle, tightens on hot.
      let wf = Math.min(1.35, 0.6 + vel * 0.045);
      if (idle > 70) wf += Math.sin(t * 2.4) * 0.05;
      wf *= 1 - hotF * 0.3;

      // Ribbon polygon: offset each point along its normal by half the local width.
      const L = [], R = [];
      let centerD = "";
      for (let i = 0; i < SEGMENTS; i++) {
        const a = pts[i], b = pts[i + 1] || pts[i - 1];
        let nx = normals[i].x, ny = normals[i].y;
        const dx = b.x - a.x, dy = b.y - a.y;
        const len = Math.hypot(dx, dy);
        if (len > 0.01) {
          const s = i === SEGMENTS - 1 ? -1 : 1;
          nx = (-dy / len) * s;
          ny = (dx / len) * s;
          normals[i].x = nx;
          normals[i].y = ny;
        }
        const w = Math.max(0.4, (BASE_WIDTH / 2) * wf * Math.pow(1 - i / SEGMENTS, 1.15));
        L.push((a.x + nx * w).toFixed(1) + " " + (a.y + ny * w).toFixed(1));
        R.push((a.x - nx * w).toFixed(1) + " " + (a.y - ny * w).toFixed(1));
        centerD += (i ? "L" : "M") + a.x.toFixed(1) + " " + a.y.toFixed(1);
      }
      ribbon.setAttribute("d", "M" + L.join("L") + "L" + R.reverse().join("L") + "Z");
      halo.setAttribute("d", centerD);
      halo.setAttribute("stroke-width", (BASE_WIDTH * 1.15 * wf).toFixed(1));

      head.setAttribute("cx", pts[0].x.toFixed(1));
      head.setAttribute("cy", pts[0].y.toFixed(1));
      head.setAttribute("r", ((BASE_WIDTH / 2) * wf).toFixed(1));
      head.setAttribute("fill", mix(RAMP_RGB[0], HOT_RGB, hotF));

      grad.setAttribute("x1", pts[0].x.toFixed(0));
      grad.setAttribute("y1", pts[0].y.toFixed(0));
      grad.setAttribute("x2", pts[SEGMENTS - 1].x.toFixed(0));
      grad.setAttribute("y2", pts[SEGMENTS - 1].y.toFixed(0));
      for (let i = 0; i < stops.length; i++) stops[i].setAttribute("stop-color", mix(RAMP_RGB[i], HOT_RGB, hotF * 0.85));

      // Gold dust from the head, rationed by distance traveled.
      emitAcc += d0;
      if (vel > 2) {
        while (emitAcc > 26) {
          emitAcc -= 26;
          spawnDust(pts[0].x, pts[0].y, 1.2, BASE_WIDTH * wf * 0.6);
        }
      } else emitAcc = Math.min(emitAcc, 26);

      for (const p of dust) {
        if (p.life <= 0) continue;
        p.life--;
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.03;
        const f = Math.max(0, p.life / p.maxLife);
        p.el.setAttribute("cx", p.x.toFixed(1));
        p.el.setAttribute("cy", p.y.toFixed(1));
        p.el.setAttribute("r", (p.r0 * f).toFixed(2));
        p.el.setAttribute("fill-opacity", (0.9 * f).toFixed(2));
      }

      for (const r of rings) {
        if (r.prog >= 1) continue;
        r.prog = Math.min(1, r.prog + 1 / 26);
        r.el.setAttribute("cx", r.x);
        r.el.setAttribute("cy", r.y);
        r.el.setAttribute("r", (6 + r.prog * 44).toFixed(1));
        r.el.setAttribute("stroke-width", (2.5 * (1 - r.prog) + 0.4).toFixed(2));
        r.el.setAttribute("stroke-opacity", (0.7 * (1 - r.prog)).toFixed(2));
      }

      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerdown", onDown);
      svg.replaceChildren();
    };
  }, [active]);

  if (!active) return null;
  return (
    <svg
      ref={svgRef}
      aria-hidden="true"
      style={{
        position: "fixed",
        inset: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        zIndex: 300,
        overflow: "hidden",
      }}
    />
  );
}
