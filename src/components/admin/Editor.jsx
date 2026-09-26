import { useState } from "react";
import { adm } from "../../lib/admin";
import { KIND_LABEL } from "../../lib/api";
import { useToast } from "./ui";

/* The event form, for #/events/new and the Edit tab. */

/* datetime-local wants local wall time without a zone */
const toLocal = (iso) => {
  if (!iso) return "";
  const d = new Date(iso);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}T${p(d.getHours())}:${p(d.getMinutes())}`;
};
const fromLocal = (v) => (v ? new Date(v).toISOString() : "");

export const blankForm = () => ({
  title: "", kind: "festival", tagline: "", description: "", venue: "", city: "Dhaka", startsAt: "", endsAt: "",
  published: true, featured: false, registrationOpen: true, allowStalls: null, stallInfo: "", capacity: 0, stallCapacity: 0, priceVisitor: 0, priceStall: 0,
});
export const toForm = (e) => ({
  title: e.title, kind: e.kind, tagline: e.tagline || "", description: e.description || "", venue: e.venue || "", city: e.city || "",
  startsAt: toLocal(e.startsAt), endsAt: toLocal(e.endsAt), published: !!e.published, featured: !!e.featured,
  registrationOpen: !!e.registration?.open, allowStalls: e.registration?.roles?.includes("stall") ?? null,
  stallInfo: e.registration?.stallInfo || "", capacity: e.registration?.capacity || 0, stallCapacity: e.registration?.stallCapacity || 0,
  priceVisitor: e.pricing?.visitor || 0, priceStall: e.pricing?.stall || 0,
});

/* field atoms live at module level so React keeps the inputs mounted while typing */
const Field = ({ k, title, f, set, errors, type = "text", span = false, help, ...rest }) => (
  <div className={span ? "md:col-span-2" : ""}>
    <label className="field-label" htmlFor={`ev-${k}`}>{title}</label>
    <input id={`ev-${k}`} type={type} className="field-input" value={f[k]} onChange={set(k)} aria-invalid={errors[k] ? "true" : undefined} {...rest} />
    {help && !errors[k] && <p className="mt-1.5 text-[12px]" style={{ color: "var(--text-dim)" }}>{help}</p>}
    {errors[k] && <p className="field-error">{errors[k]}</p>}
  </div>
);
const Check = ({ title, checked, onChange }) => (
  <label className="check">
    <input type="checkbox" checked={checked} onChange={onChange} /> {title}
  </label>
);

export default function Editor({ event, onSaved, onCancel }) {
  const say = useToast();
  const [f, setF] = useState(() => (event ? toForm(event) : blankForm()));
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);
  const set = (k) => (e) => setF((x) => ({ ...x, [k]: e.target.type === "checkbox" ? e.target.checked : e.target.value }));
  const stalls = f.allowStalls === null ? f.kind === "festival" : f.allowStalls;

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    const body = { ...f, capacity: Number(f.capacity) || 0, stallCapacity: Number(f.stallCapacity) || 0, priceVisitor: Number(f.priceVisitor) || 0, priceStall: Number(f.priceStall) || 0, startsAt: fromLocal(f.startsAt), endsAt: fromLocal(f.endsAt) };
    try {
      const d = event ? await adm.patch(`/events/${event.id}`, body) : await adm.post("/events", body);
      say(event ? "Saved" : "Event created");
      onSaved(d.event);
    } catch (err) {
      const details = err.details && Object.keys(err.details).length ? err.details : {};
      setErrors({ ...details, _: Object.keys(details).length ? "" : err.message });
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel">
      <div className="grid gap-5 md:grid-cols-2">
        <Field k="title" title="Title" f={f} set={set} errors={errors} span required maxLength={80} />
        <div>
          <label className="field-label" htmlFor="ev-kind">Kind</label>
          <select id="ev-kind" className="field-select" value={f.kind} onChange={set("kind")}>
            {Object.entries(KIND_LABEL).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <p className="mt-1.5 text-[12px]" style={{ color: "var(--text-dim)" }}>Festivals take stall bookings and visitors; everything else is attend-only.</p>
          {errors.kind && <p className="field-error">{errors.kind}</p>}
        </div>
        <Field k="tagline" title="Tagline" f={f} set={set} errors={errors} maxLength={160} />
        <Field k="venue" title="Venue" f={f} set={set} errors={errors} maxLength={120} />
        <Field k="city" title="City" f={f} set={set} errors={errors} maxLength={60} />
        <Field k="startsAt" title="Starts" f={f} set={set} errors={errors} type="datetime-local" required help="Local wall time." />
        <Field k="endsAt" title="Ends (optional)" f={f} set={set} errors={errors} type="datetime-local" />
        <div className="md:col-span-2">
          <label className="field-label" htmlFor="ev-description">Description</label>
          <textarea id="ev-description" rows={4} className="field-textarea resize-y" value={f.description} onChange={set("description")} maxLength={2000} />
          {errors.description && <p className="field-error">{errors.description}</p>}
        </div>
        <div className="md:col-span-2 flex flex-wrap gap-x-6 gap-y-3 py-1">
          <Check title="Published" checked={f.published} onChange={set("published")} />
          <Check title="Registration open" checked={f.registrationOpen} onChange={set("registrationOpen")} />
          <Check title="Featured" checked={f.featured} onChange={set("featured")} />
          <Check title="Stall bookings" checked={stalls} onChange={(e) => setF((x) => ({ ...x, allowStalls: e.target.checked }))} />
        </div>
        {stalls && <Field k="stallInfo" title="Stall info shown to vendors" f={f} set={set} errors={errors} span maxLength={300} />}
        <Field k="priceVisitor" title="Ticket price (BDT)" f={f} set={set} errors={errors} type="number" min={0} help="0 = free entry" />
        {stalls && <Field k="priceStall" title="Stall price (BDT)" f={f} set={set} errors={errors} type="number" min={0} help="0 = free" />}
        <Field k="capacity" title="Visitor capacity" f={f} set={set} errors={errors} type="number" min={0} help="0 = open" />
        {stalls && <Field k="stallCapacity" title="Stall capacity" f={f} set={set} errors={errors} type="number" min={0} help="0 = open" />}
      </div>
      {errors._ && <p className="field-error mt-4">{errors._}</p>}
      <div className="mt-6 flex flex-wrap gap-3">
        <button type="submit" className="btn-primary" disabled={busy}>{busy ? "Saving…" : "Save"}</button>
        <button type="button" className="btn-ghost" onClick={onCancel}>Cancel</button>
      </div>
    </form>
  );
}
