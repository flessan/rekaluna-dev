import { useEffect, useMemo, useState } from "react";
import { Icon } from "../lib/icons";
import { useStorage } from "../lib/storage-hooks";
import { storage, uid, type ResourceLink } from "../lib/storage";
import { useToast } from "../lib/toast";
import { Modal } from "../components/Modal";

export default function ResourcesPage() {
  const { data, update } = useStorage();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState<string>("All");
  const [editing, setEditing] = useState<ResourceLink | null>(null);
  const [addOpen, setAddOpen] = useState(false);

  const categories = useMemo(() => {
    const set = new Set(data.resources.map((r) => r.category));
    return ["All", ...Array.from(set)];
  }, [data.resources]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.resources.filter((r) => {
      if (cat !== "All" && r.category !== cat) return false;
      if (!query) return true;
      return r.name.toLowerCase().includes(query) || r.url.toLowerCase().includes(query);
    });
  }, [data.resources, q, cat]);

  const isFav = (id: string) => data.favorites.some((f) => f.id === `res-${id}`);
  const toggleFav = (r: ResourceLink) => {
    const fid = `res-${r.id}`;
    update((d) => {
      const exists = d.favorites.find((f) => f.id === fid);
      return {
        ...d,
        favorites: exists
          ? d.favorites.filter((f) => f.id !== fid)
          : [
              ...d.favorites,
              { id: fid, kind: "resource", label: r.name, icon: iconFor(r.category), target: r.url },
            ],
      };
    });
    toast.push(isFav(r.id) ? "Removed from favorites" : "Added to favorites");
  };

  const openResource = (r: ResourceLink) => {
    window.open(r.url, "_blank", "noopener,noreferrer");
    storage.addRecent({ kind: "resource", label: r.name, meta: r.category });
  };

  // Allow AppShell FAB to open add-resource modal
  useEffect(() => {
    const open = () => setAddOpen(true);
    window.addEventListener("rekaluna:add-resource", open);
    return () => window.removeEventListener("rekaluna:add-resource", open);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resource Center</h1>
          <p className="text-sm text-muted mt-1">Drivers, PDF tools, and utilities — one tab away.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Icon name="plus" /> Add resource
        </button>
      </div>

      <div className="card p-3 flex items-center gap-2">
        <Icon name="search" className="text-muted px-2" />
        <input
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder="Search resources…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="btn btn-ghost !p-2" onClick={() => setQ("")} aria-label="Clear">
            <Icon name="xmark" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-1 px-1">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-snappy ${
              cat === c ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]" : "hover:bg-[rgba(26,26,27,0.04)]"
            }`}
            style={{ borderColor: cat === c ? "var(--brand)" : "var(--line)" }}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
            <Icon name="folder" />
          </div>
          <p className="text-sm text-muted">No resources match. Try another search or add your own.</p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r) => (
            <div key={r.id} className="card p-4 flex flex-col gap-2 hover:shadow-soft transition-snappy group">
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ background: "var(--brand)" }}
                >
                  <Icon name={iconFor(r.category)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate">{r.name}</div>
                  <div className="text-[11px] text-muted truncate">{r.url}</div>
                </div>
                <button
                  onClick={() => toggleFav(r)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                    isFav(r.id) ? "text-[color:var(--brand)]" : "text-muted hover:text-[color:var(--brand)]"
                  }`}
                  aria-label={isFav(r.id) ? "Unfavorite" : "Favorite"}
                  title={isFav(r.id) ? "Favorited" : "Add to favorites"}
                >
                  <Icon name="star" {...(isFav(r.id) ? { className: "" } : {})} />
                </button>
              </div>
              {r.note && <div className="text-xs text-muted">{r.note}</div>}
              <div className="flex items-center gap-2 pt-1">
                <span className="chip">{r.category}</span>
                <div className="flex-1" />
                <button onClick={() => setEditing(r)} className="btn btn-ghost !py-1.5 !px-2 text-xs text-muted">
                  <Icon name="edit" /> Edit
                </button>
                <button onClick={() => openResource(r)} className="btn btn-secondary !py-1.5 text-xs">
                  <Icon name="up-right-from-square" /> Open
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ResourceModal
        open={addOpen || !!editing}
        onClose={() => {
          setAddOpen(false);
          setEditing(null);
        }}
        initial={editing}
        onSave={(r) => {
          if (editing) {
            update((d) => ({ ...d, resources: d.resources.map((x) => (x.id === r.id ? r : x)) }));
            toast.push("Resource updated");
          } else {
            update((d) => ({ ...d, resources: [r, ...d.resources] }));
            toast.push("Resource added");
          }
          setAddOpen(false);
          setEditing(null);
        }}
        onDelete={
          editing
            ? (id) => {
                update((d) => ({ ...d, resources: d.resources.filter((x) => x.id !== id) }));
                toast.push("Resource deleted");
                setEditing(null);
              }
            : undefined
        }
      />
    </div>
  );
}

function iconFor(cat: string) {
  switch (cat) {
    case "PDF":
      return "file-pdf";
    case "Image":
      return "image";
    case "Driver":
      return "download";
    default:
      return "link";
  }
}

function ResourceModal({
  open,
  onClose,
  initial,
  onSave,
  onDelete,
}: {
  open: boolean;
  onClose: () => void;
  initial: ResourceLink | null;
  onSave: (r: ResourceLink) => void;
  onDelete?: (id: string) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [url, setUrl] = useState(initial?.url ?? "");
  const [category, setCategory] = useState(initial?.category ?? "Utility");
  const [note, setNote] = useState(initial?.note ?? "");

  // reset when initial/modal open changes
  useEffect(() => {
    setName(initial?.name ?? "");
    setUrl(initial?.url ?? "");
    setCategory(initial?.category ?? "Utility");
    setNote(initial?.note ?? "");
  }, [initial, open]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={initial ? "Edit resource" : "Add resource"}
      footer={
        <>
          {initial && onDelete && (
            <button
              className="btn btn-danger mr-auto"
              onClick={() => onDelete(initial.id)}
            >
              <Icon name="trash" /> Delete
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!name.trim() || !url.trim()) return;
              const normalized = /^https?:\/\//.test(url) ? url : "https://" + url;
              onSave({
                id: initial?.id ?? uid(),
                name: name.trim(),
                url: normalized,
                category: category.trim() || "Utility",
                note: note.trim() || undefined,
              });
            }}
          >
            <Icon name="save" /> Save
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <div className="label mb-1">Name</div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Epson L3210 Driver" autoFocus />
        </div>
        <div>
          <div className="label mb-1">URL</div>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="label mb-1">Category</div>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="Driver / PDF / Image / Utility" />
          </div>
          <div>
            <div className="label mb-1">Note (optional)</div>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Use for L-series" />
          </div>
        </div>
      </div>
    </Modal>
  );
}
