import { ARC, HER, EVENTS } from "./logoPaths";

/* The Archer Events crest, rebuilt as clean vector from the badge artwork:
   sunrise, rays, arrow-tower, Tuscan wordmark, EVENTS ribbon, star.
   Every part carries an lg-* class so the loader can assemble it piece by piece. */
export const LOGO = { cream: "#F2E0BE", ink: "#1B1815", rust: "#B5471E", gold: "#D9A427" };

const BODY = "M82,392 Q360,372 638,368 L962,368 Q1240,372 1518,392 L1556,862 L1055,870 L800,985 L545,870 L44,862 Z";
const FULL = "M82,392 Q360,372 638,368 Q712,232 748,100 L852,100 Q888,232 962,368 Q1240,372 1518,392 L1556,862 L1055,870 L800,985 L545,870 L44,862 Z";
const TOWER = "M638,368 Q712,232 748,100 L852,100 Q888,232 962,368";
const ARROW = "M800,165 L867,300 L827,300 L827,448 Q827,494 782,500 Q764,500 758,486 Q772,474 773,452 L773,300 L733,300 Z";
const BAND = "M400,742 Q800,720 1200,742 L1200,842 Q800,864 400,842 Z";
const STAR = "M800,862 Q807,893 838,900 Q807,907 800,938 Q793,907 762,900 Q793,893 800,862 Z";

/* five sunrise bars a side, left ends cut on a diagonal, right ends tucked under the sun */
const RAYS = [0, 1, 2, 3, 4].map((i) => {
  const yt = 190 + i * 40;
  const yb = yt + 24;
  const xs = 435 - i * 57;
  return {
    l: `${xs + 14},${yt} 640,${yt} 640,${yb} ${xs},${yb}`,
    r: `${1586 - xs},${yt} 960,${yt} 960,${yb} ${1600 - xs},${yb}`,
  };
});

export function CrestArt() {
  const { cream, ink, rust, gold } = LOGO;
  return (
    <>
      <g className="lg-rays">
        {RAYS.map((r, i) => (
          <polygon key={`l${i}`} className="lg-ray lg-ray-l" points={r.l} fill={rust} />
        ))}
        {RAYS.map((r, i) => (
          <polygon key={`r${i}`} className="lg-ray lg-ray-r" points={r.r} fill={rust} />
        ))}
      </g>
      <g className="lg-sun">
        <circle cx="800" cy="320" r="288" fill={cream} />
        <circle cx="800" cy="320" r="276" fill={ink} />
        <circle cx="800" cy="320" r="266" fill={gold} />
      </g>
      <g className="lg-body">
        <path d={BODY} fill="none" stroke={rust} strokeWidth="44" strokeLinejoin="round" />
        <path d={TOWER} fill="none" stroke={ink} strokeWidth="40" strokeLinejoin="round" />
        <path d={FULL} fill="none" stroke={cream} strokeWidth="24" strokeLinejoin="round" />
        <path d={FULL} fill={ink} />
      </g>
      <path className="lg-arrow" d={ARROW} fill={cream} />
      <g className="lg-word" fill={cream}>
        <path d={ARC} />
        <path d={HER} />
      </g>
      <g className="lg-band">
        <path d={BAND} fill={rust} stroke={cream} strokeWidth="10" strokeLinejoin="round" />
        <g stroke={cream} strokeWidth="7" strokeLinecap="round">
          <line x1="262" y1="776" x2="380" y2="776" />
          <line x1="262" y1="808" x2="380" y2="808" />
          <line x1="1220" y1="776" x2="1338" y2="776" />
          <line x1="1220" y1="808" x2="1338" y2="808" />
        </g>
        <path d={EVENTS} fill={cream} />
      </g>
      <path className="lg-star" d={STAR} fill={rust} />
    </>
  );
}

/* The badge lockup (wide). */
export function Crest({ className = "", label = "Archer Events" }) {
  return (
    <svg viewBox="0 0 1600 1024" className={className} role="img" aria-label={label}>
      <CrestArt />
    </svg>
  );
}

/* The round seal: cream disc, rust + ink rings, crest inside. */
export function Seal({ className = "", label = "Archer Events" }) {
  const { cream, ink, rust } = LOGO;
  return (
    <svg viewBox="0 0 1600 1600" className={className} role="img" aria-label={label}>
      <circle cx="800" cy="800" r="795" fill={cream} />
      <circle cx="800" cy="800" r="789" fill="none" stroke={rust} strokeWidth="12" />
      <circle cx="800" cy="800" r="766" fill="none" stroke={ink} strokeWidth="18" />
      <g transform="translate(128 360) scale(0.84)">
        <CrestArt />
      </g>
    </svg>
  );
}
