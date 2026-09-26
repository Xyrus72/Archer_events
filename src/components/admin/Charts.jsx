import { num } from "./ui";

/* Charts for the ticket office: plain SVG and divs, purple / cyan, no chart library. */

const dayLabel = (s) => new Date(`${s}T12:00:00+06:00`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Dhaka" });

/* stacked columns per day: visitors in purple, stalls in cyan; the last 30 days with activity */
export function Timeline({ rows, id = "tl" }) {
  const data = rows.filter((d) => d.visitors + d.stalls > 0).slice(-30);
  const W = 600, H = 150, pad = 10;
  const max = Math.max(1, ...data.map((d) => d.visitors + d.stalls));
  const cw = data.length ? W / data.length : W;
  const bw = Math.max(4, Math.min(26, cw - 6));
  const gridY = [0.25, 0.5, 0.75].map((f) => H - (H - pad) * f);
  return (
    <div className="panel">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="panel-title">Registrations per day</h3>
        <span className="inline-flex items-center gap-4 text-[12px]" style={{ color: "var(--text-muted)" }}>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--purple)" }} /> Visitors</span>
          <span className="inline-flex items-center gap-1.5"><i className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: "var(--cyan)" }} /> Stalls</span>
        </span>
      </div>
      {!data.length ? (
        <p className="mt-3 text-[13px]" style={{ color: "var(--text-dim)" }}>Nothing yet.</p>
      ) : (
        <svg viewBox={`0 0 ${W} ${H + 22}`} className="mt-4 w-full h-auto" role="img" aria-label="Registrations per day">
          <defs>
            <linearGradient id={`${id}-v`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0" stopColor="#a78bfa" />
              <stop offset="1" stopColor="#7c3aed" />
            </linearGradient>
          </defs>
          {gridY.map((y) => <line key={y} x1="0" x2={W} y1={y} y2={y} stroke="currentColor" strokeOpacity="0.08" strokeDasharray="3 4" />)}
          {data.map((d, i) => {
            const x = i * cw + (cw - bw) / 2;
            const hv = ((H - pad) * d.visitors) / max;
            const hs = ((H - pad) * d.stalls) / max;
            const first = i === 0, last = i === data.length - 1;
            return (
              <g key={d.day}>
                <title>{`${dayLabel(d.day)} · ${d.visitors} visitors${d.stalls ? `, ${d.stalls} stalls` : ""}`}</title>
                <rect x={x} y={H - hv} width={bw} height={hv} rx="2" fill={`url(#${id}-v)`} />
                {hs > 0 && <rect x={x} y={H - hv - hs} width={bw} height={hs} rx="2" fill="#06b6d4" />}
                {(first || last) && (
                  <text x={first ? x : x + bw} y={H + 16} textAnchor={first ? "start" : "end"} fontSize="10.5" fill="currentColor" fillOpacity="0.55">{dayLabel(d.day)}</text>
                )}
              </g>
            );
          })}
          <line x1="0" y1={H + 0.5} x2={W} y2={H + 0.5} stroke="currentColor" strokeOpacity="0.15" />
        </svg>
      )}
    </div>
  );
}

/* one breakdown panel: label, bar sized against the largest row, count and share on the right */
export function Bars({ title, rows, color = "", note }) {
  const total = rows.reduce((n, r) => n + r.n, 0);
  const max = Math.max(1, ...rows.map((r) => r.n));
  return (
    <div className="panel">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="panel-title">{title}</h3>
        {note && <span className="text-[12px]" style={{ color: "var(--text-dim)" }}>{note}</span>}
      </div>
      {total === 0 ? (
        <p className="mt-3 text-[13px]" style={{ color: "var(--text-dim)" }}>No answers yet.</p>
      ) : (
        <ul className="mt-4 grid gap-2.5">
          {rows.map((r) => {
            const dim = r.label === "Not answered";
            return (
              <li key={r.label} className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)_auto] items-center gap-3 text-[13px]">
                <span className="truncate" style={{ color: dim ? "var(--text-dim)" : "var(--text)" }}>{r.label}</span>
                <span className="bar-track">
                  <span className={`bar-fill block ${dim ? "dim" : color}`} style={{ width: `${(r.n / max) * 100}%` }} />
                </span>
                <span className="tnum whitespace-nowrap w-[72px] text-right" style={{ color: "var(--text-muted)" }}>
                  {num(r.n)} <span style={{ color: "var(--text-dim)" }}>· {Math.round((r.n / total) * 100)}%</span>
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/* 24 slim columns: what time of day people sign up (Dhaka) */
export function Hours({ rows }) {
  const max = Math.max(1, ...rows.map((r) => r.n));
  const peak = rows.reduce((a, b) => (b.n > a.n ? b : a), rows[0]);
  const hh = (h) => String(h).padStart(2, "0");
  return (
    <div className="panel">
      <div className="flex items-baseline justify-between gap-3 flex-wrap">
        <h3 className="panel-title">Time of day</h3>
        {peak?.n > 0 && <span className="text-[12px]" style={{ color: "var(--text-muted)" }}>Busiest around {hh(peak.hour)}:00</span>}
      </div>
      <div className="mt-4 flex items-end gap-[3px] h-[64px]">
        {rows.map((r) => (
          <span
            key={r.hour}
            title={`${hh(r.hour)}:00 · ${r.n}`}
            className="flex-1 rounded-t-[2px]"
            style={{ height: `${Math.max(3, (r.n / max) * 100)}%`, background: "var(--cyan)", opacity: r.n ? 0.9 : 0.2 }}
          />
        ))}
      </div>
      <div className="flex justify-between text-[10.5px] mt-2 tnum" style={{ color: "var(--text-dim)" }}><span>00:00</span><span>12:00</span><span>23:00</span></div>
    </div>
  );
}

/* capacity meter; goes amber when it is nearly full */
export function Capacity({ label, used, cap, color = "" }) {
  if (!cap) return null;
  const pct = Math.min(100, Math.round((used / cap) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span className="text-[13px] font-medium" style={{ color: "var(--text)" }}>{label}</span>
        <span className="text-[12px] tnum" style={{ color: "var(--text-muted)" }}>{num(used)} / {num(cap)} · {pct}%</span>
      </div>
      <div className="bar-track mt-2" style={{ height: 10 }}>
        <div className={`bar-fill ${pct >= 90 ? "amber" : color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}
