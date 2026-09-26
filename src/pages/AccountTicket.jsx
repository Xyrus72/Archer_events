import { useState } from "react";
import { Diamond } from "../components/Ornaments";
import { fmtDate, fmtTime, fmtWhere, waLink } from "../lib/api";
import { startCheckout } from "../lib/pay";
import { METHODS, taka } from "../../backend/shared/payment";

/* One ticket, printed the way a real one is: the facts on the left, the code in the
   middle where a stub would be, what you can do with it on the right. */

const STATUS = {
  pending: ["Awaiting approval", "bg-mustard/30 text-ink"],
  confirmed: ["Confirmed", "bg-olive/40 text-ink"],
  cancelled: ["Cancelled", "bg-ink/10 text-ink/45"],
};

/* the one line that tells a guest where they actually stand */
function standing(t) {
  if (t.checkedInAt) return ["in", "You're inside. Enjoy it."];
  if (t.status === "cancelled") return ["off", "This ticket is cancelled. Register again any time."];
  if (t.status === "confirmed") return ["ok", "Approved by Archer Events — your place is held. Show this code at the gate."];
  if (t.payment?.status === "paid") return ["ok", "Paid. We're finishing the approval — you'll see it here."];
  if (t.amount > 0) return ["due", "Reserved. Pay to lock it in, or settle at the desk."];
  return ["wait", "Reserved. The office confirms these by hand — check back shortly."];
}
const STANDING_CLS = {
  ok: "border-olive/60 bg-olive/15 text-coffee",
  in: "border-rust/60 bg-rust/12 text-rust",
  due: "border-rust/45 bg-rust/10 text-rust",
  wait: "border-ink/20 bg-ink/5 text-coffee",
  off: "border-ink/15 bg-ink/5 text-ink/50",
};
const chip =
  "px-[12px] py-[8px] font-label text-[12px] font-medium tracking-[0.16em] uppercase border-[1.5px] border-ink/30 text-ink/75 transition-colors hover:border-rust hover:text-rust";

export default function Ticket({ t, onCancel, busy }) {
  const [paying, setPaying] = useState(false);
  const [payBusy, setPayBusy] = useState(false);
  const [payError, setPayError] = useState("");

  const [statusLabel, statusCls] = STATUS[t.status] || STATUS.pending;
  const [tone, line] = standing(t);
  const checkedIn = !!t.checkedInAt;
  const paid = t.payment?.status === "paid";
  const owes = !paid && t.amount > 0 && t.status !== "cancelled" && !t.event?.over;
  const canCancel = !checkedIn && !paid && t.status !== "cancelled" && t.event && !t.event.over;

  async function go(method) {
    setPayBusy(true);
    setPayError("");
    try {
      const { checkoutUrl } = await startCheckout(t.id, method);
      window.location.assign(checkoutUrl);
    } catch (err) {
      setPayError(err.message || "Couldn't open the counter. Try again.");
      setPayBusy(false);
    }
  }

  return (
    <article className="border-t-2 border-line first:border-t-0 py-[26px] first:pt-[6px]">
      <div className="grid gap-x-[32px] gap-y-[20px] items-start grid-cols-1 min-[900px]:grid-cols-[minmax(0,1fr)_auto_auto]">
        {/* what and when */}
        <div className="min-w-0">
          <h3 className="font-display text-[clamp(21px,2.4vw,30px)] leading-[1.15] text-ink">{t.event?.title || "Event"}</h3>
          {t.event && (
            <p className="mt-[8px] font-label text-[14px] font-medium tracking-[0.14em] uppercase text-ink/65 leading-[1.6]">
              {fmtDate(t.event.startsAt)} · {fmtTime(t.event.startsAt)}
              {fmtWhere(t.event) && <span className="block text-ink/50">{fmtWhere(t.event)}</span>}
            </p>
          )}
          <p className="mt-[12px] flex flex-wrap items-center gap-[10px]">
            <span className={`px-[11px] py-[5px] font-label text-[12px] font-semibold tracking-[0.18em] uppercase ${statusCls}`}>
              {checkedIn ? "Checked in" : statusLabel}
            </span>
            {paid ? (
              <span className="px-[11px] py-[5px] font-label text-[12px] font-semibold tracking-[0.18em] uppercase bg-olive/35 text-ink">
                Paid {taka(t.payment.amount)}
              </span>
            ) : t.amount > 0 ? (
              <span className="px-[11px] py-[5px] font-label text-[12px] font-semibold tracking-[0.18em] uppercase bg-rust/15 text-rust">
                Due {taka(t.amount)}
              </span>
            ) : (
              <span className="font-label text-[12.5px] tracking-[0.18em] uppercase text-ink/45">Free entry</span>
            )}
            <span className="font-label text-[12.5px] tracking-[0.18em] uppercase text-ink/45">
              {t.role === "stall" ? t.business || "Stall" : t.guests > 1 ? `${t.guests} people` : "Just you"}
            </span>
          </p>
          <p className={`mt-[14px] inline-flex items-start gap-[10px] border-l-[3px] pl-[14px] py-[7px] pr-[14px] text-[15px] leading-[1.5] ${STANDING_CLS[tone]}`}>
            {(tone === "ok" || tone === "in") && <Diamond className="w-3.5 h-3.5 mt-[4px] shrink-0" />}
            {line}
          </p>
        </div>

        {/* the stub */}
        <div className="bg-ink rounded-[5px] px-[24px] py-[16px] text-center min-[900px]:min-w-[210px]">
          <span className="block font-label text-[11px] font-medium tracking-[0.34em] uppercase text-cream/55">Ticket code</span>
          <span className="block font-display text-[clamp(24px,3vw,32px)] leading-none text-mustard tracking-[0.06em] mt-[7px]">
            {t.code}
          </span>
        </div>

        {/* what you can do */}
        <div className="flex flex-wrap items-start gap-[10px] min-[900px]:flex-col min-[900px]:w-[190px]">
          {owes && !paying && (
            <button type="button" className="btn px-[20px] py-[12px] text-[12px] w-full justify-center" onClick={() => setPaying(true)}>
              Pay {taka(t.amount)}
            </button>
          )}
          <a
            className="btn ghost px-[20px] py-[12px] text-[12px] min-[900px]:w-full min-[900px]:justify-center"
            href={waLink(`Hi Archer Events! My ticket for ${t.event?.title || "the event"} is ${t.code}.`)}
            target="_blank"
            rel="noreferrer"
          >
            Save on WhatsApp
          </a>
          {canCancel && (
            <button
              type="button"
              className={`btn ghost px-[20px] py-[12px] text-[12px] min-[900px]:w-full min-[900px]:justify-center ${busy ? "opacity-50 pointer-events-none" : ""}`}
              onClick={() => onCancel(t)}
            >
              Cancel ticket
            </button>
          )}
        </div>
      </div>

      {/* the counter opens in place: pick a way to pay, then the checkout screen */}
      {paying && owes && (
        <div className="mt-[18px] pt-[18px] border-t border-line">
          <span className="block font-label text-[12px] font-semibold tracking-[0.3em] uppercase text-rust mb-[10px]">
            Pay {taka(t.amount)} with
          </span>
          <div className="flex flex-wrap items-center gap-[10px]">
            {METHODS.map((m) => (
              <button
                key={m.id}
                type="button"
                className={`${chip} ${payBusy ? "opacity-50 pointer-events-none" : ""}`}
                onClick={() => go(m.id)}
              >
                {m.name}
                <span className="block font-body normal-case tracking-normal text-[11px] text-ink/45">{m.hint}</span>
              </button>
            ))}
            <button type="button" className="font-label text-[12px] tracking-[0.18em] uppercase text-ink/50 underline" onClick={() => setPaying(false)}>
              Not now
            </button>
          </div>
          {payError && <p className="mt-[10px] font-label text-[12px] tracking-[0.12em] uppercase text-rust">{payError}</p>}
        </div>
      )}
    </article>
  );
}
