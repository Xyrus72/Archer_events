/* Pieces of the poster: a flat sun, stacked clouds, and the little dark figures
   that fill a hall. Everything is plain shapes — no gradients, no texture, so it
   stays crisp at any size and reads as printed rather than photographed. */

export const INK = "#2A1D12";
export const RUST = "#B8501F";
export const ORANGE = "#DE7A2E";
export const OLIVE = "#7E8A6A";
export const CREAM = "#F2E3C0";
export const GLOW = "#F0B25A";

/* a repeatable pseudo-random so the crowd looks hand-placed but never re-shuffles */
export const rand = (seed) => {
  const x = Math.sin(seed * 12.9898) * 43758.5453;
  return x - Math.floor(x);
};

/* flat disc with the striped rays that cut across it, top-right of the poster */
export function Sun({ cx, cy, r, stripes = true }) {
  return (
    <g>
      <circle cx={cx} cy={cy} r={r} fill={ORANGE} />
      {stripes &&
        [0, 1, 2, 3, 4, 5].map((i) => {
          const y = cy - r * 0.62 + i * (r * 0.17);
          const w = r * (2.2 - i * 0.18);
          return <rect key={i} x={cx - r * 2.35 + i * (r * 0.16)} y={y} width={w} height={r * 0.075} fill={ORANGE} />;
        })}
    </g>
  );
}

/* the fan of light behind the stage */
export function Rays({ cx, cy, count = 13, len, spread = 150, from = -165 }) {
  return (
    <g opacity="0.55">
      {Array.from({ length: count }, (_, i) => {
        const a = ((from + (spread / (count - 1)) * i) * Math.PI) / 180;
        const w = 3 + (i % 3);
        return (
          <rect
            key={i}
            x={cx}
            y={cy - w / 2}
            width={len}
            height={w}
            fill={ORANGE}
            transform={`rotate(${(a * 180) / Math.PI} ${cx} ${cy})`}
          />
        );
      })}
    </g>
  );
}

/* scalloped cloud bank — a row of overlapping circles on a flat base */
export function Cloud({ x, y, w, h, fill, lobes = 5 }) {
  const r = h * 0.62;
  return (
    <g fill={fill}>
      {Array.from({ length: lobes }, (_, i) => (
        <circle key={i} cx={x + (w / (lobes - 1)) * i} cy={y - Math.abs(Math.sin(i * 1.3)) * h * 0.35} r={r * (0.72 + rand(i + x) * 0.5)} />
      ))}
      <rect x={x - r} y={y} width={w + r * 2} height={h} rx={h * 0.2} />
    </g>
  );
}

/* one standing person, seen from behind: head, shoulders, legs */
export function Figure({ x, y, h, arms = false, fill = INK }) {
  const hd = h * 0.17;
  return (
    <g fill={fill}>
      <circle cx={x} cy={y - h + hd} r={hd} />
      <path d={`M${x - h * 0.16},${y} L${x - h * 0.15},${y - h * 0.66} Q${x},${y - h * 0.82} ${x + h * 0.15},${y - h * 0.66} L${x + h * 0.16},${y} Z`} />
      {arms && (
        <>
          <rect x={x - h * 0.25} y={y - h * 0.95} width={h * 0.07} height={h * 0.42} rx={h * 0.035} transform={`rotate(18 ${x - h * 0.22} ${y - h * 0.6})`} />
          <rect x={x + h * 0.18} y={y - h * 0.95} width={h * 0.07} height={h * 0.42} rx={h * 0.035} transform={`rotate(-18 ${x + h * 0.21} ${y - h * 0.6})`} />
        </>
      )}
    </g>
  );
}

/* a loose row of people along the floor */
export function Crowd({ from, to, y, h, count, arms = false, seed = 1, fill = INK }) {
  return (
    <g>
      {Array.from({ length: count }, (_, i) => {
        const t = count === 1 ? 0.5 : i / (count - 1);
        const jitter = (rand(seed + i) - 0.5) * ((to - from) / count) * 0.7;
        return (
          <Figure
            key={i}
            x={from + (to - from) * t + jitter}
            y={y + rand(seed + i * 3) * h * 0.06}
            h={h * (0.88 + rand(seed + i * 7) * 0.26)}
            arms={arms && rand(seed + i * 11) > 0.35}
            fill={fill}
          />
        );
      })}
    </g>
  );
}

/* strings of bulbs, the thing that makes a place feel like an evening */
export function Festoon({ x1, x2, y, sag = 16, bulbs = 9, color = GLOW }) {
  const mid = (x1 + x2) / 2;
  return (
    <g>
      <path d={`M${x1},${y} Q${mid},${y + sag * 2} ${x2},${y}`} fill="none" stroke={INK} strokeWidth="2" />
      {Array.from({ length: bulbs }, (_, i) => {
        const t = (i + 0.5) / bulbs;
        const bx = x1 + (x2 - x1) * t;
        const by = y + 2 * sag * t * (1 - t) * 2;
        return (
          <g key={i}>
            <line x1={bx} y1={by} x2={bx} y2={by + 7} stroke={INK} strokeWidth="1.6" />
            <circle cx={bx} cy={by + 11} r="4.2" fill={color} />
          </g>
        );
      })}
    </g>
  );
}
