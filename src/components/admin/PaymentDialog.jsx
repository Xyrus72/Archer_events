import { useState } from "react";
import { adm } from "../../lib/admin";
import { Dialog, useToast } from "./ui";
import { METHODS, taka } from "../../../backend/shared/payment";

/* Settling up at the desk. Taking money asks how it arrived and any reference the
   guest can quote later; refunding just needs a reason someone can read next month. */

const TAKE_METHODS = [{ id: "cash", name: "Cash", hint: "At the desk" }, ...METHODS];

export default function PaymentDialog({ row, action, onClose, onDone }) {
  const say = useToast();
  const refund = action === "refund";
  const [method, setMethod] = useState("cash");
  const [txnId, setTxnId] = useState("");
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await adm.post(`/registrations/${row.id}/payment`, { action: refund ? "refund" : "mark-paid", method, txnId, note });
      say(refund ? `Refund recorded for ${row.code}` : `${taka(row.amount)} taken for ${row.code}`);
      onDone();
    } catch (err) {
      setError(err.message || "That didn't go through.");
      setBusy(false);
    }
  }

  return (
    <Dialog
      title={refund ? "Record a refund" : `Take ${taka(row.amount)}`}
      subtitle={`${row.name} · ${row.code}`}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        {!refund && (
          <>
            <span className="field-label">How it arrived</span>
            <div className="flex flex-wrap gap-2 mb-4">
              {TAKE_METHODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  className={method === m.id ? "btn-primary btn-sm" : "btn-ghost btn-sm"}
                  onClick={() => setMethod(m.id)}
                >
                  {m.name}
                </button>
              ))}
            </div>
            <label className="field-label" htmlFor="pay-txn">Reference (optional)</label>
            <input
              id="pay-txn"
              className="field-input mb-4"
              placeholder={method === "cash" ? "Receipt number" : "Transaction id"}
              value={txnId}
              onChange={(e) => setTxnId(e.target.value)}
              autoFocus
            />
          </>
        )}

        <label className="field-label" htmlFor="pay-note">{refund ? "Why" : "Note (optional)"}</label>
        <input
          id="pay-note"
          className="field-input"
          placeholder={refund ? "Guest cancelled, refunded by bKash" : "Anything worth remembering"}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          autoFocus={refund}
        />

        {error && <p className="field-error">{error}</p>}

        <div className="mt-5 flex gap-3">
          <button type="submit" className={refund ? "btn-danger" : "btn-primary"} disabled={busy}>
            {busy ? "Saving" : refund ? "Record refund" : `Mark paid · ${taka(row.amount)}`}
          </button>
          <button type="button" className="btn-ghost" onClick={onClose} disabled={busy}>
            Cancel
          </button>
        </div>
      </form>
    </Dialog>
  );
}
