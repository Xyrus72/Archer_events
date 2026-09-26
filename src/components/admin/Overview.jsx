import { useEffect, useState } from "react";
import { adm } from "../../lib/admin";
import { fmtDate, KIND_LABEL } from "../../lib/api";
import { Timeline } from "./Charts";
import { Badge, Empty, hasStalls, isPast, num, Spinner, StatCard, useToast } from "./ui";
import { IconBell, IconCalendar, IconStore, IconTicket, IconTrend, IconUsers } from "./icons";

/* #/ — the numbers across every event, plus the calendar. */

const todayDhaka = () => new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Dhaka", weekday: "long", day: "numeric", month: "long", year: "numeric" }).format(new Date());

/* every event's daily timeline folded into one */
function merge(timelines) {
  const byDay = new Map();
  for (const rows of timelines) {
    for (const r of rows) {
      const cur = byDay.get(r.day) || { day: r.day, visitors: 0, stalls: 0 };
      cur.visitors += r.visitors;
      cur.stalls += r.stalls;
      byDay.set(r.day, cur);
    }
  }
  return [...byDay.values()].sort((a, b) => (a.day < b.day ? -1 : 1));
}

export default function Overview({ events }) {
  const say = useToast();
  const [overview, setOverview] = useState(null);
  const [timeline, setTimeline] = useState(null);

  useEffect(() => {
    let on = true;
    adm.get("/overview").then((d) => on && setOverview(d.overview)).catch((e) => on && say(e.message, true));
    return () => {
      on = false;
    };
  }, [say]);

  useEffect(() => {
    if (!events) return;
    let on = true;
    Promise.all(events.map((e) => adm.get(`/events/${e.id}/stats`).then((d) => d.stats.timeline)))
      .then((all) => on && setTimeline(merge(all)))
      .catch(() => on && setTimeline([]));
    return () => {
      on = false;
    };
  }, [events]);

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="page-label"><span>Ticket office</span></div>
        <h1 className="page-title">Overview</h1>
        <p className="page-subtitle">{todayDhaka()}</p>
      </header>

      {!overview ? (
        <Spinner />
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
          <StatCard icon={IconCalendar} tint="tint-purple" value={overview.upcoming} label="Upcoming events" sub={`${num(overview.events)} on the books`} />
          <StatCard icon={IconTicket} tint="tint-cyan" value={overview.registrations} label="Registered" sub="across all events" />
          <StatCard icon={IconUsers} tint="tint-green" value={overview.heads} label="Heads expected" />
          <StatCard icon={IconStore} tint="tint-amber" value={overview.stalls} label="Stalls booked" />
          <StatCard icon={IconTrend} tint="tint-pink" value={overview.last7} label="Last 7 days" sub="new registrations" />
          <StatCard icon={IconBell} tint="tint-purple" value={overview.waiting} label="Waiting list" />
        </div>
      )}

      <div className="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr] items-start">
        {timeline ? <Timeline rows={timeline} id="ov" /> : <div className="panel"><h3 className="panel-title">Registrations per day</h3><Spinner className="py-10" /></div>}

        <div className="panel">
          <h3 className="panel-title">Events</h3>
          {!events ? (
            <Spinner className="py-10" />
          ) : !events.length ? (
            <div className="mt-4"><Empty>Nothing on the calendar yet.</Empty></div>
          ) : (
            <div className="data-table mt-4 overflow-x-auto">
              <table>
                <thead>
                  <tr><th>Event</th><th>Date</th><th>Status</th><th className="text-right">Registered</th><th className="text-right">Heads</th></tr>
                </thead>
                <tbody>
                  {events.map((e) => (
                    <tr key={e.id} className="cursor-pointer" onClick={() => { window.location.hash = `#/events/${e.id}/stats`; }}>
                      <td>
                        <strong>{e.title}</strong>
                        <div className="mt-1"><Badge tone="info">{KIND_LABEL[e.kind] || e.kind}</Badge></div>
                      </td>
                      <td className="whitespace-nowrap tnum">{fmtDate(e.startsAt)}</td>
                      <td>
                        <div className="flex flex-wrap gap-1">
                          <Badge tone={e.published ? "success" : "neutral"}>{e.published ? "Published" : "Draft"}</Badge>
                          {isPast(e) ? <Badge>Past</Badge> : <Badge tone={e.registration?.open ? "cyan" : "neutral"}>{e.registration?.open ? "Open" : "Closed"}</Badge>}
                        </div>
                      </td>
                      <td className="text-right tnum"><strong>{num(e.counts.total)}</strong>{hasStalls(e) ? <span style={{ color: "var(--text-dim)" }}> · {e.counts.stall} stalls</span> : null}</td>
                      <td className="text-right tnum">{num(e.counts.guests)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
