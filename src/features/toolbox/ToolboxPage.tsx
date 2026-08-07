import { useEffect, useMemo, useState } from "react";
import { Icon } from "../../lib/icons";
import { useStorage } from "../../hooks/useStorage";
import { storage, uid } from "../../lib/storage";
import { useToast } from "../../lib/toast";
import { Modal } from "../../components/Modal";
import type { ResourceLink, Favorite } from "../../types";

export default function ToolboxPage() {
  const { data, update } = useStorage();
  const toast = useToast();
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("All");
  const [addOpen, setAddOpen] = useState(false);
  const [editing, setEditing] = useState<ResourceLink | null>(null);

  const categories = useMemo(() => {
    const set = new Set(data.resources.map((r: ResourceLink) => r.category));
    return ["All", ...Array.from(set)];
  }, [data.resources]);

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase();
    return data.resources.filter((r: ResourceLink) => {
      if (cat !== "All" && r.category !== cat) return false;
      if (!query) return true;
      return (
        r.name.toLowerCase().includes(query) ||
        r.url.toLowerCase().includes(query) ||
        r.category.toLowerCase().includes(query)
      );
    });
  }, [data.resources, q, cat]);

  const isFav = (id: string) =>
    data.favorites.some((f: Favorite) => f.id === `res-${id}`);

  const toggleFav = (r: ResourceLink) => {
    const fid = `res-${r.id}`;
    update((d) => {
      const exists = d.favorites.find((f: Favorite) => f.id === fid);
      return {
        ...d,
        favorites: exists
          ? d.favorites.filter((f: Favorite) => f.id !== fid)
          : [
              ...d.favorites,
              {
                id: fid,
                kind: "resource" as const,
                label: r.name,
                icon: iconForCategory(r.category),
                target: r.url,
              },
            ],
      };
    });
  };

  const openResource = (r: ResourceLink) => {
    window.open(r.url, "_blank", "noopener,noreferrer");
    storage.addRecent({ kind: "resource", label: r.name, detail: r.category });
  };

  const handleSave = (r: ResourceLink) => {
    if (editing) {
      update((d) => ({
        ...d,
        resources: d.resources.map((x: ResourceLink) => (x.id === r.id ? r : x)),
      }));
      toast.push("Resource updated");
    } else {
      update((d) => ({ ...d, resources: [r, ...d.resources] }));
      toast.push("Resource added");
    }
    setAddOpen(false);
    setEditing(null);
  };

  const handleDelete = (id: string) => {
    update((d) => ({
      ...d,
      resources: d.resources.filter((x: ResourceLink) => x.id !== id),
    }));
    toast.push("Resource deleted");
    setEditing(null);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      <div className="flex items-end justify-between gap-3 flex-wrap">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            Toolbox
          </h1>
          <p className="text-sm text-muted mt-1">
            Drivers, PDF tools, and utilities — organized and ready.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Icon name="plus" /> Add Resource
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
          <button
            className="btn btn-ghost !p-2"
            onClick={() => setQ("")}
            aria-label="Clear search"
          >
            <Icon name="xmark" />
          </button>
        )}
      </div>

      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
        {categories.map((c: string) => (
          <button
            key={c}
            onClick={() => setCat(c)}
            className={`px-3 py-1.5 rounded-full text-sm whitespace-nowrap border transition-snappy ${
              cat === c
                ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]"
                : "hover:bg-[rgba(26,26,27,0.04)]"
            }`}
            style={{
              borderColor: cat === c ? "var(--brand)" : "var(--line)",
            }}
          >
            {c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div
            className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center mb-3"
            style={{
              background: "color-mix(in srgb, var(--brand) 10%, transparent)",
              color: "var(--brand)",
            }}
          >
            <Icon name="folder" size="lg" />
          </div>
          <p className="text-sm text-muted">
            No resources found. Try a different search or add your own.
          </p>
        </div>
      ) : (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
          {filtered.map((r: ResourceLink) => (
            <div
              key={r.id}
              className="card p-4 flex flex-col gap-2 hover:shadow-soft transition-snappy group"
            >
              <div className="flex items-start gap-3">
                <div
                  className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0"
                  style={{ background: "var(--brand)" }}
                >
                  <Icon name={iconForCategory(r.category)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold truncate text-sm">
                    {r.name}
                  </div>
                  <div className="text-[11px] text-muted truncate">
                    {r.url.replace(/^https?:\/\//, "")}
                  </div>
                </div>
                <button
                  onClick={() => toggleFav(r)}
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-snappy ${
                    isFav(r.id)
                      ? "text-brand"
                      : "text-muted hover:text-brand"
                  }`}
                  aria-label={isFav(r.id) ? "Unfavorite" : "Favorite"}
                >
                  <Icon name="star" />
                </button>
              </div>
              {r.note && (
                <div className="text-xs text-muted leading-relaxed">
                  {r.note}
                </div>
              )}
              <div className="flex items-center gap-2 pt-1">
                <span className="chip">{r.category}</span>
                <div className="flex-1" />
                <button
                  onClick={() => setEditing(r)}
                  className="btn btn-ghost !py-1.5 !px-2 text-xs text-muted opacity-0 group-hover:opacity-100 transition"
                >
                  <Icon name="edit" />
                </button>
                <button
                  onClick={() => openResource(r)}
                  className="btn btn-secondary !py-1.5 text-xs"
                >
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
        onSave={handleSave}
        onDelete={
          editing ? (id: string) => handleDelete(id) : undefined
        }
      />
    </div>
  );
}

function iconForCategory(cat: string): string {
  const map: Record<string, string> = {
    PDF: "file-pdf",
    Image: "image",
    Driver: "download",
    Screenshot: "crop",
    Utility: "tools",
  };
  return map[cat] ?? "link";
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
      title={initial ? "Edit Resource" : "Add Resource"}
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
          <button className="btn btn-secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              if (!name.trim() || !url.trim()) return;
              const normalized = /^https?:\/\//.test(url)
                ? url
                : "https://" + url;
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
          <input
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Epson L3210 Driver"
            autoFocus
          />
        </div>
        <div>
          <div className="label mb-1">URL</div>
          <input
            className="input"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="label mb-1">Category</div>
            <input
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="Driver / PDF / Image / Utility"
            />
          </div>
          <div>
            <div className="label mb-1">Note</div>
            <input
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Optional note"
            />
          </div>
        </div>
      </div>
    </Modal>
  );
}
