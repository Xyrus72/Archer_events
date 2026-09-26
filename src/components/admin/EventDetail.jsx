import { useEffect, useState } from "react";
import { adm } from "../../lib/admin";
import { fmtDate, fmtTime, KIND_LABEL } from "../../lib/api";
import { Bars, Capacity, Hours, Timeline } from "./Charts";
import Editor from "./Editor";
import Registrations from "./Registrations";
import { Badge, Empty, go, hasStalls, num, Spinner, StatCard, useToast } from "./ui";
import { IconCheck, IconClock, IconExternal, IconStore, IconTicket, IconTrend, IconUsers } from "./icons";
import { taka } from "../../../backend/shared/payment";

/* #/events/:id/:tab — one event: its numbers, its people, its settings. */

const TABS = [["stats", "Stats"], ["registrations", "Registrations"], ["edit", "Edit"]];

/* remounted by key whenever the event or its registrations change, so it always starts fresh */
function StatsTab({ event }) {
  const say = useToast();
  const [s, setS] = useState(null);
  useEffect(() => {
    let on = true;
    adm.get(`/events/${event.id}/stats`).then((d) => on && setS(d.stats)).catch((e) => on && say(e.message, true));
    return () => {
      on = false;
    };
  }, [event.id, say]);

  if (!s) return <Spinner />;
  const stalls = hasStalls(event);
  const t = s.totals;
  const confirmedPct = t.registrations ? Math.round((t.confirmed / t.registrations) * 100) : 0;
  const hasCap = s.capacity.visitors > 0 || (stalls && s.capacity.stalls > 0);

  return (
    <div className="fade-in grid gap-6">
      <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4">
        <StatCard icon={IconTicket} tint="tint-purple" value={t.registrations} label="Registered" sub={`${num(t.last7)} in the last 7 days`} />
        <StatCard icon={IconUsers} tint="tint-green" value={t.heads} label="Heads expected" sub={`${s.avgParty || 0} per party`} />
        {stalls
          ? <StatCard icon={IconStore} tint="tint-amber" value={t.stalls} label="Stalls" sub={s.capacity.stalls ? `of ${num(s.capacity.stalls)}` : "no cap"} />
          : <StatCard icon={IconUsers} tint="tint-amber" value={t.visitors} label="Visitors" />}
        <StatCard icon={IconCheck} tint="tint-cyan" value={`${confirmedPct}%`} label="Confirmed" sub={`${num(t.pending)} pending · ${num(t.cancelled)} cancelled`} />
        <StatCard icon={IconTrend} tint="tint-pink" value={t.last24} label="Last 24h" sub="new registrations" />
        <StatCard icon={IconClock} tint="tint-purple" value={s.daysToGo === null ? "Done" : s.daysToGo} label={s.daysToGo === null ? "Status" : "Days to go"} sub={`${num(t.withEmail)} left an email`} />
        {s.money && (s.money.takings > 0 || s.money.owed > 0) && (
          <>
            <StatCard
              icon={IconCheck}
              tint="tint-green"
              value={taka(s.money.takings)}
              label="Taken"
              sub={`${num(s.money.paidCount)} paid${s.money.atCounter ? ` · ${num(s.money.atCounter)} at the desk` : ""}`}
            />
            <StatCard
              icon={IconTrend}
              tint="tint-rose"
              value={taka(s.money.owed)}
              label="Still owed"
              sub={s.money.refunded ? `${taka(s.money.refunded)} refunded` : "across unpaid tickets"}
            />
            <StatCard icon={IconUsers} tint="tint-cyan" value={t.checkedIn || 0} label="Checked in" sub="at the gate" />
          </>
        )}
      </div>

      {hasCap && (
        <div className="panel grid gap-5 md:grid-cols-2">
          <Capacity label="Visitor capacity" used={t.heads} cap={s.capacity.visitors} />
          {stalls && <Capacity label="Stall capacity" used={t.stalls} cap={s.capacity.stalls} color="cyan" />}
        </div>
      )}

      <Timeline rows={s.timeline} id={`ev-${event.id.slice(0, 8)}`} />

      <div className="grid gap-6 lg:grid-cols-2">
        <Bars title="Age range" rows={s.age} />
        <Bars title="How they heard about it" rows={s.source} color="cyan" />
        <Bars title="Coming from" rows={s.area} color="green" note="visitors" />
        <Bars title="Gender" rows={s.gender} color="pink" />
        <Bars title="Party size" rows={s.party} color="amber" note="visitors" />
        {stalls && <Bars title="What the stalls sell" rows={s.category} />}
      </div>

      <Hours rows={s.hours} />
    </div>
  );
}

export default function EventDetail({ events, id, tab, onChange }) {
  const say = useToast();
  const [tick, setTick] = useState(0);
  const event = events?.find((e) => e.id === id);

  if (!events) return <Spinner />;
  if (!event) {
    return (
      <div className="fade-in">
        <header className="page-header"><div className="page-label"><span>Event</span></div><h1 className="page-title">Not found</h1></header>
        <Empty>
          <span>That event is not on the calendar any more.</span>
          <a className="btn-ghost btn-sm mt-4" href="#/events">Back to events</a>
        </Empty>
      </div>
    );
  }

  const changed = () => {
    setTick((n) => n + 1);
    onChange();
  };
  async function remove() {
    if (!confirm("Delete this event? Only possible while it has no registrations.")) return;
    try {
      await adm.del(`/events/${event.id}`);
      say("Deleted");
      onChange();
      go("#/events");
    } catch (e) {
      say(e.message, true);
    }
  }

  return (
    <div className="fade-in">
      <header className="page-header flex flex-wrap items-end justify-between gap-4">
        <div className="min-w-0">
          <div className="page-label"><span>Event</span></div>
          <h1 className="page-title">{event.title}</h1>
          <p className="page-subtitle flex flex-wrap items-center gap-x-2 gap-y-1">
            <span className="tnum">{fmtDate(event.startsAt)} · {fmtTime(event.startsAt)}</span>
            {(event.venue || event.city) && <span>· {[event.venue, event.city].filter(Boolean).join(", ")}</span>}
            <Badge tone="info">{KIND_LABEL[event.kind] || event.kind}</Badge>
          </p>
        </div>
        <a className="btn-ghost" href="/#next" target="_blank" rel="noreferrer"><IconExternal width={14} height={14} /> View on site</a>
      </header>

      <div className="tabs mb-6">
        {TABS.map(([k, label]) => (
          <a key={k} href={`#/events/${event.id}/${k}`} className={`tab${tab === k ? " active" : ""}`}>{label}</a>
        ))}
      </div>

      {tab === "stats" && <StatsTab key={`${event.id}-${tick}`} event={event} />}
      {tab === "registrations" && <Registrations event={event} onChange={changed} />}
      {tab === "edit" && (
        <div className="grid gap-6">
          <Editor key={event.updatedAt || event.id} event={event} onSaved={() => { onChange(); go(`#/events/${event.id}/stats`); }} onCancel={() => go(`#/events/${event.id}/stats`)} />
          <div className="panel flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="panel-title">Delete this event</div>
              <p className="text-[13px] mt-1" style={{ color: "var(--text-muted)" }}>Only possible while it has no registrations — unpublish it otherwise.</p>
            </div>
            <button className="btn-danger" onClick={remove}>Delete</button>
          </div>
        </div>
      )}
    </div>
  );
}
