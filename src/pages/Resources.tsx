import { useEffect, useMemo, useState } from "react";
import { Icon } from "../lib/icons";
import { useStorage } from "../lib/storage-hooks";
import { storage, uid, type ResourceLink } from "../lib/storage";
import { useToast } from "../lib/toast";
import { Modal } from "../components/Modal";
import { useI18n } from "../lib/i18n";

const LINUX_SCRIPT_URL = "/install/linux/epson-l3210.sh";
const LINUX_SCRIPT_PUBLIC_URL = "https://rekaluna.pages.dev/install/linux/epson-l3210.sh";
const LINUX_PIPE_COMMAND = `curl -fsSL ${LINUX_SCRIPT_PUBLIC_URL} | bash`;
const LINUX_LOCAL_COMMAND = `curl -fL ${LINUX_SCRIPT_PUBLIC_URL} -o install-epson-l3210.sh
chmod +x install-epson-l3210.sh
./install-epson-l3210.sh`;

export default function ResourcesPage() {
  const { data, update } = useStorage();
  const toast = useToast();
  const { t, locale } = useI18n();
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
    toast.push(isFav(r.id) ? t("removedFavorite") : t("addedFavorite"));
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("resourceCenter")}</h1>
          <p className="text-sm text-muted mt-1">{t("resourceDescription")}</p>
        </div>
        <button className="btn btn-primary" onClick={() => setAddOpen(true)}>
          <Icon name="plus" /> {t("addResource")}
        </button>
      </div>

      <LinuxPrintBanner
        onCopy={async (command) => {
          try {
            await navigator.clipboard.writeText(command);
            toast.push(t("linuxCommandCopied"));
          } catch {
            toast.push(t("linuxCopyFailed"));
          }
        }}
      />

      <div className="card p-3 flex items-center gap-2">
        <Icon name="search" className="text-muted px-2" />
        <input
          className="flex-1 bg-transparent outline-none text-sm"
          placeholder={t("searchResources")}
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
        {q && (
          <button className="btn btn-ghost !p-2" onClick={() => setQ("")} aria-label={t("clear")}>
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
            {c === "All" ? t("all") : c === "Driver" ? t("driver") : c === "PDF" ? t("pdfCategory") : c === "Image" ? t("imageCategory") : c === "Utility" ? t("utility") : c === "Printing" ? t("printing") : c}
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
            <Icon name="folder" />
          </div>
          <p className="text-sm text-muted">{t("noResources")}</p>
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
                  aria-label={isFav(r.id) ? t("unfavorite") : t("favorite")}
                  title={isFav(r.id) ? t("favorite") : t("addResource")}
                >
                  <Icon name="star" {...(isFav(r.id) ? { className: "" } : {})} />
                </button>
              </div>
              {r.note && <div className="text-xs text-muted">{r.note}</div>}
              <div className="flex items-center gap-2 pt-1">
                <span className="chip">{r.category === "Driver" ? t("driver") : r.category === "PDF" ? t("pdfCategory") : r.category === "Image" ? t("imageCategory") : r.category === "Utility" ? t("utility") : r.category === "Printing" ? t("printing") : r.category}</span>
                <div className="flex-1" />
                <button onClick={() => setEditing(r)} className="btn btn-ghost !py-1.5 !px-2 text-xs text-muted">
                  <Icon name="edit" /> {t("edit")}
                </button>
                <button onClick={() => openResource(r)} className="btn btn-secondary !py-1.5 text-xs">
                  <Icon name="up-right-from-square" /> {t("open")}
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
            toast.push(t("resourceUpdated"));
          } else {
            update((d) => ({ ...d, resources: [r, ...d.resources] }));
            toast.push(t("resourceAdded"));
          }
          setAddOpen(false);
          setEditing(null);
        }}
        onDelete={
          editing
            ? (id) => {
                update((d) => ({ ...d, resources: d.resources.filter((x) => x.id !== id) }));
                toast.push(t("resourceDeleted"));
                setEditing(null);
              }
            : undefined
        }
      />
    </div>
  );
}

function LinuxPrintBanner({ onCopy }: { onCopy: (command: string) => void }) {
  const { t } = useI18n();

  return (
    <section className="card p-4 md:p-5 space-y-4" aria-labelledby="linux-printing-title">
      <div className="flex flex-wrap items-start gap-3">
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-white shrink-0"
          style={{ background: "#252a30" }}
        >
          <Icon name="terminal" size="lg" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="label mb-1">{t("linuxSupportEyebrow")}</div>
          <h2 id="linux-printing-title" className="text-lg md:text-xl font-bold tracking-tight">
            {t("linuxSupportTitle")}
          </h2>
          <p className="text-sm text-muted mt-1 max-w-3xl">{t("linuxSupportBody")}</p>
        </div>
        <span className="chip">Arch · Debian/Ubuntu · Fedora · openSUSE</span>
      </div>

      <div className="grid lg:grid-cols-2 gap-3">
        <div className="rounded-xl border p-3 min-w-0" style={{ borderColor: "var(--line)", background: "var(--canvas)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="font-semibold text-sm">{t("linuxOneLineTitle")}</div>
            <button className="btn btn-secondary !py-1.5 !px-2.5 text-xs" onClick={() => onCopy(LINUX_PIPE_COMMAND)}>
              <Icon name="copy" /> {t("copyCommand")}
            </button>
          </div>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap break-all rounded-lg p-3 overflow-x-auto" style={{ background: "var(--surface)", color: "var(--ink)" }}>
            <code>{LINUX_PIPE_COMMAND}</code>
          </pre>
        </div>

        <div className="rounded-xl border p-3 min-w-0" style={{ borderColor: "var(--line)", background: "var(--canvas)" }}>
          <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
            <div className="font-semibold text-sm">{t("linuxLocalTitle")}</div>
            <button className="btn btn-secondary !py-1.5 !px-2.5 text-xs" onClick={() => onCopy(LINUX_LOCAL_COMMAND)}>
              <Icon name="copy" /> {t("copyCommand")}
            </button>
          </div>
          <pre className="text-xs leading-relaxed whitespace-pre-wrap break-all rounded-lg p-3 overflow-x-auto" style={{ background: "var(--surface)", color: "var(--ink)" }}>
            <code>{LINUX_LOCAL_COMMAND}</code>
          </pre>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <a className="btn btn-primary" href={LINUX_SCRIPT_URL} target="_blank" rel="noreferrer">
          <Icon name="code" /> {t("viewScript")}
        </a>
        <p className="text-xs text-muted flex-1 min-w-[220px]">{t("linuxSafetyNote")}</p>
      </div>
      <p className="text-xs text-muted border-t pt-3" style={{ borderColor: "var(--line)" }}>
        {t("linuxModelFallback")}
      </p>
    </section>
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
    case "Printing":
      return "print";
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
  const { t } = useI18n();
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
      title={initial ? t("editResource") : t("addResource")}
      footer={
        <>
          {initial && onDelete && (
            <button
              className="btn btn-danger mr-auto"
              onClick={() => onDelete(initial.id)}
            >
              <Icon name="trash" /> {t("delete")}
            </button>
          )}
          <button className="btn btn-secondary" onClick={onClose}>{t("cancelAction")}</button>
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
            <Icon name="save" /> {t("save")}
          </button>
        </>
      }
    >
      <div className="space-y-3">
        <div>
          <div className="label mb-1">{t("name")}</div>
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder={t("resourceNameExample")} autoFocus />
        </div>
        <div>
          <div className="label mb-1">{t("url")}</div>
          <input className="input" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <div className="label mb-1">{t("categoryLabel")}</div>
            <input className="input" value={category} onChange={(e) => setCategory(e.target.value)} placeholder={t("categoryExample")} />
          </div>
          <div>
            <div className="label mb-1">{t("optionalNoteLabel")}</div>
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} placeholder={t("noteExample")} />
          </div>
        </div>
      </div>
    </Modal>
  );
}
