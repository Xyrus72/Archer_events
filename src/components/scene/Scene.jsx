import { Cloud, Crowd, Festoon, Figure, Rays, Sun, CREAM, GLOW, INK, OLIVE, ORANGE, RUST } from "./parts";

/* The poster: three nights of work in one strip — a mela stall, a hall laid for a
   reception, a stage mid-show — under one sun. Drawn flat so it never dates. */

const W = 1600;
const H = 470;
const FLOOR = 430;

function Stall({ x }) {
  return (
    <g>
      {/* awning */}
      <g>
        <rect x={x} y={FLOOR - 210} width="210" height="16" fill={INK} />
        {Array.from({ length: 7 }, (_, i) => (
          <path key={i} d={`M${x + i * 30},${FLOOR - 194} h30 l-6,26 h-18 Z`} fill={i % 2 ? CREAM : RUST} />
        ))}
      </g>
      <rect x={x + 6} y={FLOOR - 210} width="8" height="210" fill={INK} />
      <rect x={x + 196} y={FLOOR - 210} width="8" height="210" fill={INK} />
      {/* the lit inside */}
      <rect x={x + 14} y={FLOOR - 168} width="182" height="120" fill={ORANGE} opacity="0.32" />
      <rect x={x + 14} y={FLOOR - 96} width="182" height="10" fill={INK} />
      <rect x={x + 24} y={FLOOR - 82} width="162" height="46" fill={INK} />
      <Festoon x1={x + 18} x2={x + 192} y={FLOOR - 158} sag={9} bulbs={6} />
      <Crowd from={x + 34} to={x + 176} y={FLOOR} h={92} count={4} seed={3} />
    </g>
  );
}

function Hall({ x }) {
  return (
    <g>
      {/* pitched roof and the room under it */}
      <path d={`M${x - 22},${FLOOR - 236} L${x + 200},${FLOOR - 300} L${x + 422},${FLOOR - 236} Z`} fill={INK} />
      <rect x={x} y={FLOOR - 240} width="400" height="240" fill={INK} opacity="0.92" />
      <rect x={x + 16} y={FLOOR - 222} width="368" height="200" fill={ORANGE} opacity="0.22" />
      {/* chandelier */}
      <line x1={x + 200} y1={FLOOR - 236} x2={x + 200} y2={FLOOR - 206} stroke={INK} strokeWidth="3" />
      <ellipse cx={x + 200} cy={FLOOR - 196} rx="52" ry="16" fill={GLOW} />
      <ellipse cx={x + 200} cy={FLOOR - 200} rx="30" ry="9" fill={CREAM} opacity="0.7" />
      {/* columns */}
      {[0, 1, 2, 3].map((i) => (
        <rect key={i} x={x + 30 + i * 112} y={FLOOR - 222} width="12" height="200" fill={INK} />
      ))}
      <Festoon x1={x + 34} x2={x + 196} y={FLOOR - 170} sag={11} bulbs={7} />
      <Festoon x1={x + 208} x2={x + 370} y={FLOOR - 170} sag={11} bulbs={7} />
      <Crowd from={x + 26} to={x + 374} y={FLOOR} h={108} count={11} seed={9} />
    </g>
  );
}

function Stage({ x }) {
  return (
    <g>
      {/* truss and the beams coming off it */}
      <rect x={x} y={FLOOR - 268} width="330" height="14" fill={INK} />
      <rect x={x + 4} y={FLOOR - 254} width="9" height="254" fill={INK} />
      <rect x={x + 317} y={FLOOR - 254} width="9" height="254" fill={INK} />
      {Array.from({ length: 6 }, (_, i) => {
        const bx = x + 36 + i * 52;
        return (
          <g key={i}>
            <rect x={bx - 9} y={FLOOR - 254} width="18" height="16" fill={INK} />
            <path d={`M${bx - 9},${FLOOR - 238} L${bx - 46},${FLOOR - 40} L${bx + 46},${FLOOR - 40} L${bx + 9},${FLOOR - 238} Z`} fill={GLOW} opacity="0.3" />
          </g>
        );
      })}
      {/* speakers, decks, the one person running it */}
      <rect x={x + 18} y={FLOOR - 150} width="46" height="150" fill={INK} />
      <rect x={x + 262} y={FLOOR - 150} width="46" height="150" fill={INK} />
      {[0, 1, 2].map((i) => (
        <g key={i}>
          <circle cx={x + 41} cy={FLOOR - 122 + i * 44} r="14" fill={ORANGE} opacity="0.5" />
          <circle cx={x + 285} cy={FLOOR - 122 + i * 44} r="14" fill={ORANGE} opacity="0.5" />
        </g>
      ))}
      <rect x={x + 96} y={FLOOR - 66} width="134" height="66" fill={INK} />
      <Figure x={x + 163} y={FLOOR - 66} h={104} arms fill={INK} />
      <Crowd from={x + 340} to={W - 30} y={FLOOR} h={100} count={9} arms seed={21} />
    </g>
  );
}

/* The strip itself. `flat` drops the sky so it can sit on an existing background. */
export default function Scene({ className = "", flat = false, label = "A mela stall, a reception hall and a stage, drawn as one evening" }) {
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className={className} role="img" aria-label={label} preserveAspectRatio="xMidYMax slice">
      {!flat && <rect width={W} height={H} fill={CREAM} />}

      {/* sky */}
      <Rays cx={1180} cy={FLOOR - 118} len={470} count={13} spread={126} from={-171} />
      <Sun cx={1330} cy={FLOOR - 196} r={96} stripes={false} />
      <Cloud x={70} y={FLOOR - 128} w={230} h={46} fill={OLIVE} lobes={5} />
      <Cloud x={330} y={FLOOR - 108} w={170} h={38} fill={OLIVE} lobes={4} />
      <Cloud x={1120} y={FLOOR - 118} w={210} h={44} fill={RUST} lobes={5} />
      <Cloud x={1400} y={FLOOR - 142} w={190} h={42} fill={ORANGE} lobes={5} />

      {/* the ground everyone stands on */}
      <rect x="0" y={FLOOR} width={W} height={H - FLOOR} fill={INK} />

      <Stall x={30} />
      <Hall x={520} />
      <Stage x={1010} />
      <Crowd from={300} to={520} y={FLOOR} h={100} count={5} seed={41} />
    </svg>
  );
}
