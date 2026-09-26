import { useEffect, useState } from "react";
import { adm } from "../../lib/admin";
import { fmtDate, fmtTime } from "../../lib/api";
import { Empty, Spinner, useToast } from "./ui";

/* #/waiting — people who asked to hear first while nothing was on sale. */

export default function Waiting() {
  const say = useToast();
  const [rows, setRows] = useState(null);
  useEffect(() => {
    let on = true;
    adm.get("/interest")
      .then((d) => on && setRows(d.interest))
      .catch((e) => {
        if (on) {
          setRows([]);
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
        <h1 className="page-title">Waiting list</h1>
        <p className="page-subtitle">People who asked to hear first while nothing was on sale.</p>
      </header>

      {!rows ? (
        <Spinner />
      ) : !rows.length ? (
        <Empty>Nobody is waiting right now.</Empty>
      ) : (
        <div className="data-table overflow-x-auto">
          <table className="min-w-[560px]">
            <thead>
              <tr><th>Name</th><th>Phone</th><th>Email</th><th>Since</th></tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id}>
                  <td><strong>{r.name}</strong></td>
                  <td className="whitespace-nowrap tnum">
                    <a href={`https://wa.me/${r.phone.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" style={{ color: "var(--cyan-ink)" }}>{r.phone}</a>
                  </td>
                  <td>{r.email || <span style={{ color: "var(--text-dim)" }}>—</span>}</td>
                  <td className="whitespace-nowrap tnum text-[12px]">{fmtDate(r.createdAt)} {fmtTime(r.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
