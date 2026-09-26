import { useEffect, useRef, useState } from "react";
import { adm, auth } from "../../lib/admin";
import { Empty, Spinner, useToast } from "./ui";
import { IconDown, IconPlus, IconUp, IconX } from "./icons";

/* "Moments we've made" — the strip of work on the front page. A tile is a photo,
   a category and a caption; the office owns all three. */

const CATEGORIES = ["Concert", "Wedding", "Corporate", "Mela", "Activation", "Themed night"];

async function putImage(id, file) {
  const res = await fetch(`/api/admin/gallery/${id}/image`, {
    method: "PUT",
    headers: { ...auth(), "Content-Type": file.type || "application/octet-stream" },
    body: file,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Upload failed (${res.status})`);
  return data.item;
}

function Tile({ item, onChange, onMove, onDelete, first, last }) {
  const say = useToast();
  const fileRef = useRef(null);
  const [busy, setBusy] = useState(false);
  const [draft, setDraft] = useState({ title: item.title, category: item.category || "", alt: item.alt || "" });
  const dirty = draft.title !== item.title || draft.category !== (item.category || "") || draft.alt !== (item.alt || "");

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (file.size > 6 * 1024 * 1024) return say("Keep photos under 6 MB", true);
    setBusy(true);
    try {
      onChange(await putImage(item.id, file));
      say("Photo uploaded");
    } catch (err) {
      say(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function save(patch) {
    setBusy(true);
    try {
      const d = await adm.patch(`/gallery/${item.id}`, {
        title: draft.title,
        category: draft.category,
        alt: draft.alt,
        published: item.published,
        order: item.order,
        ...patch,
      });
      onChange(d.item);
      setDraft({ title: d.item.title, category: d.item.category || "", alt: d.item.alt || "" });
      say("Saved");
    } catch (err) {
      say(err.message, true);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="panel grid gap-4 md:grid-cols-[220px_minmax(0,1fr)_auto] items-start">
      {/* the photo */}
      <div>
        <div
          className="relative aspect-[4/3] rounded-[10px] overflow-hidden grid place-items-center"
          style={{ background: "rgba(var(--ink-rgb),0.06)", border: "1px solid rgba(var(--ink-rgb),0.1)" }}
        >
          {item.url ? (
            <img src={item.url} alt="" className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <span className="text-[12.5px]" style={{ color: "var(--text-dim)" }}>No photo yet</span>
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" hidden onChange={pick} />
        <button className="btn-ghost btn-sm w-full mt-2" onClick={() => fileRef.current?.click()} disabled={busy}>
          {item.url ? "Replace photo" : "Upload photo"}
        </button>
      </div>

      {/* what it says */}
      <div className="grid gap-3">
        <div>
          <label className="field-label" htmlFor={`g-title-${item.id}`}>Caption</label>
          <input
            id={`g-title-${item.id}`}
            className="field-input"
            value={draft.title}
            onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
            placeholder="Neon Nights Live, Dhaka"
          />
        </div>
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className="field-label" htmlFor={`g-cat-${item.id}`}>Category</label>
            <input
              id={`g-cat-${item.id}`}
              className="field-input"
              list="gallery-categories"
              value={draft.category}
              onChange={(e) => setDraft((d) => ({ ...d, category: e.target.value }))}
              placeholder="Concert"
            />
          </div>
          <div>
            <label className="field-label" htmlFor={`g-alt-${item.id}`}>Photo description</label>
            <input
              id={`g-alt-${item.id}`}
              className="field-input"
              value={draft.alt}
              onChange={(e) => setDraft((d) => ({ ...d, alt: e.target.value }))}
              placeholder="For screen readers"
            />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <button className="btn-primary btn-sm" onClick={() => save()} disabled={busy || !dirty}>
            {dirty ? "Save" : "Saved"}
          </button>
          <label className="check">
            <input type="checkbox" checked={item.published} onChange={(e) => save({ published: e.target.checked })} />
            Show on the site
          </label>
          {!item.url && (
            <span className="text-[12px]" style={{ color: "var(--amber-ink)" }}>Needs a photo before it appears</span>
          )}
        </div>
      </div>

      {/* where it sits */}
      <div className="flex md:flex-col gap-2">
        <button className="btn-ghost btn-sm" onClick={() => onMove(item, -1)} disabled={first} aria-label="Move earlier">
          <IconUp />
        </button>
        <button className="btn-ghost btn-sm" onClick={() => onMove(item, 1)} disabled={last} aria-label="Move later">
          <IconDown />
        </button>
        <button className="btn-danger btn-sm" onClick={() => onDelete(item)} aria-label="Delete tile">
          <IconX />
        </button>
      </div>
    </div>
  );
}

export default function Gallery() {
  const say = useToast();
  const [rows, setRows] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = () =>
    adm.get("/gallery").then((d) => setRows(d.gallery)).catch((e) => {
      setRows([]);
      say(e.message, true);
    });
  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const replace = (item) => setRows((rs) => rs.map((r) => (r.id === item.id ? item : r)));

  async function add() {
    setBusy(true);
    try {
      const d = await adm.post("/gallery", { title: "New moment", category: "" });
      setRows((rs) => [...rs, d.item]);
      say("Tile added — upload a photo");
    } catch (e) {
      say(e.message, true);
    } finally {
      setBusy(false);
    }
  }

  async function remove(item) {
    if (!confirm(`Delete "${item.title}"? The photo goes with it.`)) return;
    try {
      await adm.del(`/gallery/${item.id}`);
      setRows((rs) => rs.filter((r) => r.id !== item.id));
      say("Deleted");
    } catch (e) {
      say(e.message, true);
    }
  }

  // order is a plain number, so swapping two tiles is two saves
  async function move(item, dir) {
    const i = rows.findIndex((r) => r.id === item.id);
    const j = i + dir;
    if (j < 0 || j >= rows.length) return;
    const next = [...rows];
    [next[i], next[j]] = [next[j], next[i]];
    setRows(next);
    try {
      await Promise.all(
        next.map((r, k) =>
          adm.patch(`/gallery/${r.id}`, {
            title: r.title,
            category: r.category,
            alt: r.alt,
            published: r.published,
            order: k,
          })
        )
      );
    } catch (e) {
      say(e.message, true);
      load();
    }
  }

  return (
    <div className="fade-in">
      <datalist id="gallery-categories">
        {CATEGORIES.map((c) => (
          <option key={c} value={c} />
        ))}
      </datalist>

      <header className="page-header flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="page-label"><span>Front page</span></div>
          <h1 className="page-title">Moments we&rsquo;ve made</h1>
          <p className="page-subtitle">
            The photo strip on the home page. Tiles without a photo stay hidden until you add one.
          </p>
        </div>
        <button className="btn-primary" onClick={add} disabled={busy}>
          <IconPlus /> Add a moment
        </button>
      </header>

      {rows === null ? (
        <Spinner />
      ) : !rows.length ? (
        <Empty>Nothing here yet — add your first moment.</Empty>
      ) : (
        <div className="grid gap-4">
          {rows.map((item, i) => (
            <Tile
              key={item.id}
              item={item}
              first={i === 0}
              last={i === rows.length - 1}
              onChange={replace}
              onMove={move}
              onDelete={remove}
            />
          ))}
        </div>
      )}
    </div>
  );
}
