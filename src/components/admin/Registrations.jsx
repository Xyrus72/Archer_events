import { useEffect, useState } from "react";
import { adm, auth } from "../../lib/admin";
import { fmtDate, fmtTime } from "../../lib/api";
import { Badge, Empty, hasStalls, Spinner, STATUS_TONE, useToast } from "./ui";
import PaymentDialog from "./PaymentDialog";
import { IconDownload, IconSearch } from "./icons";
import { taka } from "../../../backend/shared/payment";

/* The Registrations tab: who signed up, filterable, with confirm / cancel per row. */

const hay = (r) => `${r.name} ${r.phone} ${r.code} ${r.business || ""} ${r.email || ""}`.toLowerCase();
const NEXT = {
  pending: [["confirmed", "Confirm"], ["cancelled", "Cancel"]],
  confirmed: [["cancelled", "Cancel"]],
  cancelled: [["pending", "Restore"]],
};

export default function Registrations({ event, onChange }) {
  const say = useToast();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [status, setStatus] = useState("");
  const stalls = hasStalls(event);

  const query = new URLSearchParams({ event: event.id, ...(role && { role }), ...(status && { status }) }).toString();
  useEffect(() => {
    let on = true;
    adm.get(`/registrations?${query}`)
      .then((d) => on && setRows(d.registrations))
      .catch((e) => {
        if (on) {
          setRows([]);
          say(e.message, true);
        }
      });
    return () => {
      on = false;
    };
  }, [query, say]);

  // the desk dialog: { row, action } while staff are settling a ticket
  const [settling, setSettling] = useState(null);

  const reload = () =>
    adm.get(`/registrations?${query}`).then((d) => setRows(d.registrations)).catch((e) => say(e.message, true));

  async function checkIn(r) {
    try {
      await adm.post(`/registrations/${r.id}/checkin`, { undo: !!r.checkedInAt });
      await reload();
      say(r.checkedInAt ? `${r.code} check-in undone` : `${r.code} is in`);
      onChange?.();
    } catch (e) {
      say(e.message, true);
    }
  }

  async function setRowStatus(r, next) {
    try {
      const d = await adm.patch(`/registrations/${r.id}`, { status: next });
      setRows((rs) => rs.map((x) => (x.id === r.id ? d.registration : x)));
      say(`${r.code} ${next}`);
      onChange?.();
    } catch (e) {
      say(e.message, true);
    }
  }
  async function exportCsv() {
    try {
      const res = await fetch(`/api/admin/registrations.csv?${query}`, { headers: auth() });
      if (!res.ok) throw new Error(`Export failed (${res.status})`);
      const blob = await res.blob();
      const a = Object.assign(document.createElement("a"), { href: URL.createObjectURL(blob), download: `${event.slug}-registrations.csv` });
      a.click();
      URL.revokeObjectURL(a.href);
    } catch (e) {
      say(e.message, true);
    }
  }

  const needle = q.trim().toLowerCase();
  const shown = rows ? rows.filter((r) => !needle || hay(r).includes(needle)) : [];

  return (
    <div className="fade-in">
      <div className="flex flex-wrap items-center gap-3 mb-4">
        <div className="relative w-full sm:w-[300px]">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: "var(--text-dim)" }}><IconSearch /></span>
          <input className="field-input" style={{ paddingLeft: 38 }} placeholder="Name, phone, code or business" value={q} onChange={(e) => setQ(e.target.value)} aria-label="Search registrations" />
        </div>
        {stalls && (
          <select className="field-select w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Role">
            <option value="">All roles</option>
            <option value="visitor">Visitors</option>
            <option value="stall">Stalls</option>
          </select>
        )}
        <select className="field-select w-auto" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
          <option value="">All statuses</option>
          <option value="pending">Pending</option>
          <option value="confirmed">Confirmed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <button className="btn-ghost sm:ml-auto" onClick={exportCsv}><IconDownload width={14} height={14} /> Export CSV</button>
      </div>

      {!rows ? (
        <Spinner />
      ) : !shown.length ? (
        <Empty>{rows.length ? "Nobody matches that filter." : "No registrations yet."}</Empty>
      ) : (
        <div className="data-table overflow-x-auto">
          <table className="min-w-[900px]">
            <thead>
              <tr>
                <th>Code</th><th>Name</th><th>Phone</th><th>Role</th><th>{stalls ? "Store / heads" : "Heads"}</th><th>Payment</th><th>Note</th><th>When</th><th>Status</th>
              </tr>
            </thead>
            <tbody>
              {shown.map((r) => (
                <tr key={r.id}>
                  <td className="font-mono tnum whitespace-nowrap"><strong>{r.code}</strong></td>
                  <td>
                    <span style={{ color: "var(--text)" }}>{r.name}</span>
                    {r.email && <div className="text-[12px]" style={{ color: "var(--text-dim)" }}>{r.email}</div>}
                  </td>
                  <td className="whitespace-nowrap tnum">
                    <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ color: "var(--cyan-ink)" }}>{r.phone}</a>
                  </td>
                  <td>{r.role === "stall" ? <Badge tone="cyan">Stall vendor</Badge> : <Badge tone="info">Visitor</Badge>}</td>
                  <td className="tnum">{r.role === "stall" ? r.business || "—" : r.guests || 1}</td>
                  <td className="whitespace-nowrap tnum">
                    {r.paid ? (
                      <Badge tone="success">Paid {taka(r.amount)}</Badge>
                    ) : r.amount > 0 ? (
                      <Badge tone="warning">Due {taka(r.amount)}</Badge>
                    ) : (
                      <span style={{ color: "var(--text-dim)" }}>Free</span>
                    )}
                    {r.paymentRef && <div className="text-[11px] mt-1" style={{ color: "var(--text-dim)" }}>{r.paymentRef}</div>}
                    {r.amount > 0 && r.status !== "cancelled" && (
                      <div className="mt-1.5 flex gap-1.5">
                        {r.paid ? (
                          <button className="btn-ghost btn-sm" onClick={() => setSettling({ row: r, action: "refund" })}>Refund</button>
                        ) : (
                          <button className="btn-ghost btn-sm" onClick={() => setSettling({ row: r, action: "mark-paid" })}>Mark paid</button>
                        )}
                      </div>
                    )}
                  </td>
                  <td className="max-w-[220px] truncate" title={r.note || undefined} style={{ color: "var(--text-dim)" }}>{r.note}</td>
                  <td className="whitespace-nowrap tnum text-[12px]">{fmtDate(r.createdAt)} {fmtTime(r.createdAt)}</td>
                  <td className="whitespace-nowrap">
                    <Badge tone={STATUS_TONE[r.status]}>{r.status}</Badge>
                    {r.checkedInAt && <div className="mt-1"><Badge tone="cyan">Checked in</Badge></div>}
                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                      {r.status !== "cancelled" && (
                        <button className="btn-ghost btn-sm" onClick={() => checkIn(r)}>
                          {r.checkedInAt ? "Undo" : "Check in"}
                        </button>
                      )}
                      {NEXT[r.status]?.map(([to, label]) => (
                        <button key={to} className="btn-ghost btn-sm" onClick={() => setRowStatus(r, to)}>{label}</button>
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {settling && (
        <PaymentDialog
          row={settling.row}
          action={settling.action}
          onClose={() => setSettling(null)}
          onDone={async () => {
            setSettling(null);
            await reload();
            onChange?.();
          }}
        />
      )}
    </div>
  );
}
