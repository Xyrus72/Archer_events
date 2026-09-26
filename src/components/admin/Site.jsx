import { useEffect, useState } from "react";
import { api } from "../../lib/api";
import { Spinner, useToast } from "./ui";

/* #/site — what the homepage says about you. The hero stat strip is counted live from
   the database (published events, registered guests, cities), so there is nothing to type. */

export default function Site() {
  const say = useToast();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    let on = true;
    api.get("/api/settings")
      .then((d) => on && setStats(d.settings.heroStats || []))
      .catch((e) => {
        if (on) {
          setStats([]);
          say(e.message, true);
        }
      });
    return () => {
      on = false;
    };
  }, [say]);

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="page-label"><span>Ticket office</span></div>
        <h1 className="page-title">Site</h1>
        <p className="page-subtitle">What the homepage says about you.</p>
      </header>

      {!stats ? (
        <Spinner />
      ) : (
        <div className="panel max-w-[760px]">
          <h3 className="panel-title">Hero stats</h3>
          <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>
            Counted live from your events and registrations. Publish events and take registrations and these grow on their own.
          </p>
          <div className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-2 rounded-xl px-5 py-4" style={{ background: "var(--bg-2)", border: "1px solid var(--border)" }}>
            {stats.map((row, i) => (
              <span key={i} className="inline-flex items-baseline gap-2">
                {i > 0 && <span className="mr-1" style={{ color: "var(--text-dim)" }}>·</span>}
                <span className="gradient-text text-[22px] font-extrabold tnum tracking-tight">{row.value}</span>
                <span className="uppercase text-[11px] tracking-[0.12em]" style={{ color: "var(--text-muted)" }}>{row.label}</span>
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
