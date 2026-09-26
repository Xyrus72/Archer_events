import { useState } from "react";
import { changePassword, updateMe } from "../lib/auth";
import PasswordInput from "../components/PasswordInput";

/* Name, email, store, password — the parts of an account the owner may change.
   The phone number is the account's identity, so it is shown but never editable here. */

const field =
  "w-full bg-white/50 border-[1.5px] border-ink/25 rounded-[4px] px-[16px] py-[13px] font-body text-[16px] text-ink placeholder:text-ink/40 outline-none transition-colors focus:border-rust aria-[invalid=true]:border-rust [color-scheme:light]";
const label = "block font-label text-[12.5px] font-semibold tracking-[0.3em] uppercase text-rust mb-[8px]";
const errCls = "mt-[5px] font-label text-[12px] tracking-[0.12em] uppercase text-rust";
const okCls = "mt-[12px] font-label text-[12px] tracking-[0.12em] uppercase text-olive";

function Field({ id, title, error, children }) {
  return (
    <div>
      <label className={label} htmlFor={id}>{title}</label>
      {children}
      {error && <p className={errCls}>{error}</p>}
    </div>
  );
}

export default function Profile({ user, Section }) {
  const [form, setForm] = useState({ name: user.name, email: user.email || "", business: user.business || "" });
  const [pw, setPw] = useState({ current: "", next: "" });
  const [errors, setErrors] = useState({});
  const [pwErrors, setPwErrors] = useState({});
  const [saved, setSaved] = useState("");
  const [pwSaved, setPwSaved] = useState("");
  const [busy, setBusy] = useState("");

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const setP = (k) => (e) => setPw((f) => ({ ...f, [k]: e.target.value }));

  async function saveProfile(e) {
    e.preventDefault();
    setBusy("profile");
    setErrors({});
    setSaved("");
    try {
      await updateMe(form);
      setSaved("Saved.");
    } catch (err) {
      setErrors(err.details && Object.keys(err.details).length ? err.details : { _: err.message });
    } finally {
      setBusy("");
    }
  }

  async function savePassword(e) {
    e.preventDefault();
    setBusy("password");
    setPwErrors({});
    setPwSaved("");
    try {
      await changePassword(pw);
      setPw({ current: "", next: "" });
      setPwSaved("Password changed.");
    } catch (err) {
      setPwErrors(err.details && Object.keys(err.details).length ? err.details : { _: err.message });
    } finally {
      setBusy("");
    }
  }

  return (
    <Section title="Your details">
      <form onSubmit={saveProfile} noValidate>
        <div className="grid gap-[20px] grid-cols-1 min-[700px]:grid-cols-2 min-[1200px]:grid-cols-4">
          <Field id="pf-name" title="Name" error={errors.name}>
            <input id="pf-name" type="text" className={field} value={form.name} onChange={set("name")} aria-invalid={!!errors.name} />
          </Field>
          <Field id="pf-email" title="Email (optional)" error={errors.email}>
            <input id="pf-email" type="email" className={field} placeholder="you@example.com" value={form.email} onChange={set("email")} aria-invalid={!!errors.email} />
          </Field>
          {user.role === "stall" && (
            <Field id="pf-business" title="Store / brand" error={errors.business}>
              <input id="pf-business" type="text" className={field} value={form.business} onChange={set("business")} aria-invalid={!!errors.business} />
            </Field>
          )}
          <Field id="pf-phone" title="Phone (your sign-in)">
            <input id="pf-phone" type="tel" className={`${field} opacity-60`} value={user.phone} readOnly />
          </Field>
        </div>
        {errors._ && <p className={errCls}>{errors._}</p>}
        <div className="mt-[18px] flex items-center gap-[14px]">
          <button type="submit" className={`btn px-[22px] py-[12px] text-[11.5px] ${busy === "profile" ? "opacity-60 pointer-events-none" : ""}`}>
            Save details
          </button>
          {saved && <span className={okCls}>{saved}</span>}
        </div>
      </form>

      <form onSubmit={savePassword} noValidate className="mt-[26px] pt-[22px] border-t border-line">
        <div className="grid gap-[20px] grid-cols-1 min-[700px]:grid-cols-2">
          <Field id="pf-current" title="Current password" error={pwErrors.current}>
            <PasswordInput id="pf-current" className={field} autoComplete="current-password" value={pw.current} onChange={setP("current")} aria-invalid={!!pwErrors.current} />
          </Field>
          <Field id="pf-next" title="New password (8+)" error={pwErrors.next}>
            <PasswordInput id="pf-next" className={field} autoComplete="new-password" value={pw.next} onChange={setP("next")} aria-invalid={!!pwErrors.next} />
          </Field>
        </div>
        {pwErrors._ && <p className={errCls}>{pwErrors._}</p>}
        <div className="mt-[18px] flex items-center gap-[14px]">
          <button type="submit" className={`btn ghost px-[22px] py-[12px] text-[11.5px] ${busy === "password" ? "opacity-60 pointer-events-none" : ""}`}>
            Change password
          </button>
          {pwSaved && <span className={okCls}>{pwSaved}</span>}
        </div>
      </form>
    </Section>
  );
}
