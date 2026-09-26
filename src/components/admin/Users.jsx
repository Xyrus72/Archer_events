import { useEffect, useState } from "react";
import { adm } from "../../lib/admin";
import { fmtDate } from "../../lib/api";
import { Badge, Empty, Spinner, useToast } from "./ui";
import { IconSearch } from "./icons";

/* Everyone with an account. Roles are changed here; nothing else about a person is edited by staff. */

const ROLE_TONE = { visitor: "info", stall: "cyan", admin: "success" };
const ROLE_LABEL = { visitor: "Visitor", stall: "Stall vendor", admin: "Staff" };

export default function Users({ me }) {
  const say = useToast();
  const [rows, setRows] = useState(null);
  const [q, setQ] = useState("");
  const [role, setRole] = useState("");
  const [busy, setBusy] = useState("");

  useEffect(() => {
    let on = true;
    const t = setTimeout(() => {
      const params = new URLSearchParams({ ...(q && { q }), ...(role && { role }) });
      adm.get(`/users?${params}`)
        .then((d) => on && setRows(d.users))
        .catch((e) => {
          if (!on) return;
          setRows([]);
          say(e.message, true);
        });
    }, q ? 250 : 0);
    return () => {
      on = false;
      clearTimeout(t);
    };
  }, [q, role, say]);

  async function setUserRole(u, next) {
    if (next === u.role) return;
    if (next === "admin" && !confirm(`Make ${u.name} staff? They will be able to open the ticket office.`)) return;
    setBusy(u.id);
    try {
      const d = await adm.patch(`/users/${u.id}`, { role: next });
      setRows((rs) => rs.map((x) => (x.id === u.id ? { ...x, ...d.user } : x)));
      say(`${u.name} is now ${ROLE_LABEL[next].toLowerCase()}`);
    } catch (e) {
      say(e.message, true);
    } finally {
      setBusy("");
    }
  }

  return (
    <div className="fade-in">
      <header className="page-header">
        <div className="page-label"><span>People</span></div>
        <h1 className="page-title">Users</h1>
        <p className="page-subtitle">Everyone with an account — visitors, stall owners and staff.</p>
      </header>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <label className="relative flex-1 min-w-[220px] max-w-[420px]">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-dim)" }}><IconSearch /></span>
          <input
            className="field-input"
            style={{ paddingLeft: 38 }}
            placeholder="Name, phone, email or store"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            aria-label="Search users"
          />
        </label>
        <select className="field-select w-auto" value={role} onChange={(e) => setRole(e.target.value)} aria-label="Filter by role">
          <option value="">All roles</option>
          <option value="visitor">Visitors</option>
          <option value="stall">Stall owners</option>
          <option value="admin">Staff</option>
        </select>
        {rows && <span className="text-[12.5px] tnum" style={{ color: "var(--text-dim)" }}>{rows.length} shown</span>}
      </div>

      {rows === null ? (
        <Spinner />
      ) : !rows.length ? (
        <Empty>Nobody matches that.</Empty>
      ) : (
        <div className="data-table overflow-x-auto">
          <table>
            <thead>
              <tr>
                <th scope="col">Name</th>
                <th scope="col">Phone</th>
                <th scope="col">Role</th>
                <th scope="col">Store</th>
                <th scope="col">Tickets</th>
                <th scope="col">Joined</th>
                <th scope="col">Change role</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((u) => (
                <tr key={u.id}>
                  <td>
                    <strong>{u.name}</strong>
                    {u.email && <span className="block text-[12px]" style={{ color: "var(--text-dim)" }}>{u.email}</span>}
                  </td>
                  <td className="whitespace-nowrap">
                    <a href={`https://wa.me/${u.phone.replace("+", "")}`} target="_blank" rel="noreferrer" style={{ color: "var(--cyan-ink)" }}>{u.phone}</a>
                  </td>
                  <td><Badge tone={ROLE_TONE[u.role]}>{ROLE_LABEL[u.role]}</Badge></td>
                  <td>{u.business || <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                  <td className="tnum">{u.tickets}</td>
                  <td className="whitespace-nowrap">{fmtDate(u.createdAt)}</td>
                  <td>
                    <select
                      className="field-select w-auto"
                      style={{ padding: "6px 10px", fontSize: 12.5 }}
                      value={u.role}
                      disabled={busy === u.id || u.id === me?.user?.id}
                      onChange={(e) => setUserRole(u, e.target.value)}
                      aria-label={`Role for ${u.name}`}
                      title={u.id === me?.user?.id ? "You cannot change your own role" : undefined}
                    >
                      <option value="visitor">Visitor</option>
                      <option value="stall">Stall vendor</option>
                      <option value="admin">Staff</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
