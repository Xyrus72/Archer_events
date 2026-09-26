import { useEffect, useState } from "react";
import { Crest } from "../components/Logo";
import { Diamond } from "../components/Ornaments";
import { fmtDate, fmtTime } from "../lib/api";
import { useUser } from "../lib/auth";
import { cancelPayment, confirmPayment, getPayment } from "../lib/pay";
import { METHOD_NAME, taka } from "../../backend/shared/payment";

/* The sandbox checkout: a stand-in for the wallet's own screen, dressed as the
   rest of the site so the hand-off never feels like leaving. No money moves here. */

const field =
  "w-full bg-white/50 border-[1.5px] border-ink/25 rounded-[4px] px-[16px] py-[13px] font-body text-[18px] text-ink tracking-[0.3em] text-center outline-none transition-colors focus:border-rust aria-[invalid=true]:border-rust [color-scheme:light]";
const label = "block font-label text-[12px] font-semibold tracking-[0.3em] uppercase text-rust mb-[8px]";
const row = "flex items-baseline justify-between gap-4 py-[10px] border-b border-line last:border-b-0";
const rowKey = "font-label text-[12.5px] font-medium tracking-[0.2em] uppercase text-ink/55";
const rowVal = "font-body text-[16px] text-ink text-right";

const ref = () => decodeURIComponent(window.location.pathname.split("/").filter(Boolean)[1] || "");

export default function Pay() {
  const { user, loading } = useUser();
  const [payment, setPayment] = useState(null);
  const [error, setError] = useState("");
  const [pin, setPin] = useState("");
  const [pinError, setPinError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    document.title = "Checkout — Archer Events";
  }, []);

  useEffect(() => {
    if (!loading && !user) window.location.replace(`/login?next=${encodeURIComponent(window.location.pathname)}`);
  }, [loading, user]);

  useEffect(() => {
    if (!user) return;
    let on = true;
    getPayment(ref())
      .then((p) => on && setPayment(p))
      .catch((e) => on && setError(e.message || "We couldn't find that payment."));
    return () => {
      on = false;
    };
  }, [user]);

  async function pay(e) {
    e.preventDefault();
    setBusy(true);
    setPinError("");
    setError("");
    try {
      setPayment(await confirmPayment(payment.ref, { pin }));
    } catch (err) {
      if (err.details?.pin) setPinError(err.details.pin);
      else setError(err.message || "That didn't go through. Try again.");
    } finally {
      setBusy(false);
    }
  }

  async function drop() {
    setBusy(true);
    try {
      await cancelPayment(payment.ref);
    } catch {
      /* closing a closed payment is fine — the guest is leaving either way */
    }
    window.location.assign("/account");
  }

  if (loading || !user) return <main className="min-h-svh" />;

  const wallet = payment && payment.method !== "card";
  const done = payment?.status === "paid";

  return (
    <main className="relative min-h-svh flex flex-col items-center justify-center px-[6vw] py-[18vh]">
      <div className="sunburst opacity-50" aria-hidden="true" />

      <a href="/" className="relative" aria-label="Archer Events, home">
        <Crest className="w-[clamp(150px,20vw,210px)] h-auto" />
      </a>

      <div className="relative w-[min(620px,100%)] mt-[30px] bg-cream3 text-ink rounded-[6px] border-[3px] border-rust shadow-[0_30px_60px_rgba(27,24,21,0.18)]">
        <div className="pointer-events-none absolute inset-[5px] rounded-[3px] border border-rust/50" aria-hidden="true" />

        <div className="relative flex items-center justify-between gap-3 px-[clamp(20px,4vw,38px)] py-[13px] bg-rust text-cream rounded-t-[3px]">
          <span className="inline-flex items-center gap-3 font-label font-medium text-[12.5px] tracking-[0.34em] uppercase">
            <Diamond className="w-3 h-3 text-mustard" /> {done ? "Receipt" : "Checkout"}
          </span>
          {payment && (
            <span className="font-label text-[11.5px] tracking-[0.24em] uppercase text-cream/75">{METHOD_NAME[payment.method]}</span>
          )}
        </div>
        <div className="perf" aria-hidden="true" />

        <div className="relative px-[clamp(20px,4vw,38px)] pt-[26px] pb-[clamp(26px,3vw,36px)]">
          {error && !payment ? (
            <>
              <h1 className="h-display text-[clamp(26px,3.2vw,40px)] text-ink">Nothing to pay here.</h1>
              <p className="mt-[10px] text-lead text-coffee">{error}</p>
              <a className="btn mt-[22px]" href="/account">Back to my tickets</a>
            </>
          ) : !payment ? (
            <p className="text-lead text-coffee">Opening the counter…</p>
          ) : (
            <>
              <h1 className="h-display text-[clamp(26px,3.4vw,42px)] text-ink">
                {done ? "Paid. You're set." : `Pay ${taka(payment.amount)}`}
              </h1>
              <p className="mt-[10px] text-lead text-coffee max-w-[46ch]">
                {done
                  ? "Your seat is confirmed. Show the ticket code at the gate."
                  : `for ${payment.event?.title || "your ticket"} — ${payment.ticket?.role === "stall" ? "stall booking" : payment.ticket?.guests > 1 ? `${payment.ticket.guests} people` : "one person"}.`}
              </p>

              <div className="mt-[24px] bg-white/40 border-[1.5px] border-ink/15 rounded-[5px] px-[18px] py-[6px]">
                <div className={row}>
                  <span className={rowKey}>Event</span>
                  <span className={rowVal}>
                    {payment.event?.title}
                    {payment.event?.startsAt && (
                      <span className="block font-label text-[12px] tracking-[0.16em] uppercase text-ink/50">
                        {fmtDate(payment.event.startsAt)} · {fmtTime(payment.event.startsAt)}
                      </span>
                    )}
                  </span>
                </div>
                <div className={row}>
                  <span className={rowKey}>Ticket</span>
                  <span className={`${rowVal} font-display tracking-[0.06em]`}>{payment.ticket?.code}</span>
                </div>
                <div className={row}>
                  <span className={rowKey}>Reference</span>
                  <span className={`${rowVal} text-[14px]`}>{payment.ref}</span>
                </div>
                {done && payment.txnId && (
                  <div className={row}>
                    <span className={rowKey}>Transaction</span>
                    <span className={`${rowVal} text-[14px]`}>{payment.txnId}</span>
                  </div>
                )}
                <div className={row}>
                  <span className={rowKey}>Amount</span>
                  <span className="font-display text-[26px] text-ink tabular-nums">{taka(payment.amount)}</span>
                </div>
              </div>

              {done ? (
                <div className="mt-[26px] flex flex-wrap gap-[14px]">
                  <a className="btn" href="/account">My tickets</a>
                  <a className="btn ghost" href="/">Back to the site</a>
                </div>
              ) : (
                <form onSubmit={pay} noValidate className="mt-[26px]">
                  {wallet ? (
                    <>
                      <label className={label} htmlFor="pay-pin">{METHOD_NAME[payment.method]} PIN</label>
                      <input
                        id="pay-pin"
                        className={field}
                        inputMode="numeric"
                        maxLength={5}
                        placeholder="• • • • •"
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 5))}
                        aria-invalid={!!pinError}
                        autoFocus
                      />
                      {pinError && <p className="mt-[6px] font-label text-[12px] tracking-[0.12em] uppercase text-rust">{pinError}</p>}
                    </>
                  ) : (
                    <p className="text-golden text-coffee">
                      The card form is where your bank&rsquo;s page will open once the live gateway is switched on.
                    </p>
                  )}

                  {error && (
                    <p className="mt-[16px] px-[15px] py-[11px] border-[1.5px] border-rust/50 bg-rust/10 font-label text-[12.5px] tracking-[0.12em] uppercase text-rust">
                      {error}
                    </p>
                  )}

                  <div className="mt-[22px] flex flex-wrap items-center gap-[14px]">
                    <button type="submit" className={`btn ${busy ? "opacity-60 pointer-events-none" : ""}`} disabled={busy}>
                      {busy ? "Sending" : `Pay ${taka(payment.amount)}`} &rarr;
                    </button>
                    <button type="button" className="btn ghost" onClick={drop} disabled={busy}>
                      Cancel
                    </button>
                  </div>
                </form>
              )}

              {payment.sandbox && (
                <p className="mt-[22px] pt-[16px] border-t border-line font-label text-[11.5px] tracking-[0.18em] uppercase text-ink/45">
                  Sandbox — no money moves. Any 5 digits work as the PIN.
                </p>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}
