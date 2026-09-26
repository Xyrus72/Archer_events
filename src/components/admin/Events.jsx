import { useState } from "react";
import { fmtDate, fmtTime, KIND_LABEL } from "../../lib/api";
import { Badge, Empty, hasStalls, isPast, num, Spinner } from "./ui";
import { IconPlus, IconSearch } from "./icons";

/* #/events — the calendar as a table; a row opens the event. */

const matches = (e, q) => !q || `${e.title} ${e.venue || ""} ${e.city || ""}`.toLowerCase().includes(q);

export default function Events({ events }) {
  const [q, setQ] = useState("");
  const query = q.trim().toLowerCase();
  const rows = events ? events.filter((e) => matches(e, query)) : [];

  return (
    <div className="fade-in">
      <header className="page-header flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="page-label"><span>Ticket office</span></div>
          <h1 className="page-title">Events</h1>
          <p className="page-subtitle">Everything on the calendar, published or not.</p>
        </div>
        <a className="btn-primary" href="#/events/new"><IconPlus width={14} height={14} /> New event</a>
      </header>

      <div className="relative max-w-[380px] mb-4">
        <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }}><IconSearch /></span>
        <input className="field-input" style={{ paddingLeft: 38 }} placeholder="Search by title or venue" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search events" />
      </div>

      {!events ? (
        <Spinner />
      ) : !rows.length ? (
        <Empty>{events.length ? "No event matches that search." : "Nothing on the calendar yet."}</Empty>
      ) : (
        <div className="data-table overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th>Title</th><th>Date</th><th>Kind</th><th>Status</th>
                <th className="text-right">Registered</th><th className="text-right">Heads</th><th className="text-right">Stalls</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((e) => (
                <tr key={e.id} className="cursor-pointer" onClick={() => { window.location.hash = `#/events/${e.id}/stats`; }}>
                  <td>
                    <strong>{e.title}</strong>
                    {(e.venue || e.city) && <div className="text-[12px] mt-0.5" style={{ color: "var(--text-dim)" }}>{[e.venue, e.city].filter(Boolean).join(", ")}</div>}
                  </td>
                  <td className="whitespace-nowrap tnum">
                    {fmtDate(e.startsAt)}
                    <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{fmtTime(e.startsAt)}</div>
                  </td>
                  <td><Badge tone="info">{KIND_LABEL[e.kind] || e.kind}</Badge></td>
                  <td>
                    <div className="flex flex-wrap gap-1">
                      <Badge tone={e.published ? "success" : "neutral"}>{e.published ? "Published" : "Draft"}</Badge>
                      <Badge tone={e.registration?.open ? "cyan" : "neutral"}>{e.registration?.open ? "Open" : "Closed"}</Badge>
                      {isPast(e) && <Badge>Past</Badge>}
                    </div>
                  </td>
                  <td className="text-right tnum"><strong>{num(e.counts.total)}</strong></td>
                  <td className="text-right tnum">{num(e.counts.guests)}</td>
                  <td className="text-right tnum">{hasStalls(e) ? num(e.counts.stall) : <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
