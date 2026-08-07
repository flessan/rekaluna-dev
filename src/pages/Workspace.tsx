import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { useStorage } from "../lib/storage-hooks";
import { format, storage } from "../lib/storage";

function greeting() {
  const h = new Date().getHours();
  if (h < 11) return "Good morning.";
  if (h < 15) return "Good afternoon.";
  if (h < 20) return "Good evening.";
  return "Welcome back.";
}

const QUICK = [
  { to: "/print", label: "Quick Print", icon: "print", desc: "Paste, preview, print." },
  { to: "/price", label: "Price Desk", icon: "calculator", desc: "Answer 'How much?' fast." },
  { to: "/resources", label: "Resources", icon: "folder", desc: "Drivers and tools." },
  { to: "/support", label: "Support", icon: "heart", desc: "Donate and say thanks." },
];

function timeAgo(ts: number): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function WorkspacePage() {
  const { data, update } = useStorage();
  const nav = useNavigate();

  const favs = data.favorites;
  const recents = useMemo(() => data.recents.slice(0, 8), [data.recents]);

  const toggleFavorite = (id: string) => {
    update((d) => {
      const exists = d.favorites.find((f) => f.id === id);
      return {
        ...d,
        favorites: exists ? d.favorites.filter((f) => f.id !== id) : [...d.favorites, {
          id,
          kind: "tool",
          label: QUICK.find((q) => q.to === id)?.label ?? "Favorite",
          icon: QUICK.find((q) => q.to === id)?.icon ?? "star",
          target: id,
        }],
      };
    });
  };

  const isFav = (id: string) => favs.some((f) => f.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{greeting()}</h1>
          <p className="text-sm text-muted mt-1">
            One workspace. Every essential tool. Zero friction.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Local-only · nothing leaves this device
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="label">Quick actions</h2>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK.map((q) => (
            <button
              key={q.to}
              onClick={() => nav(q.to)}
              className="card p-4 text-left hover:shadow-soft transition-snappy group relative"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 text-white"
                style={{ background: "var(--brand)" }}
              >
                <Icon name={q.icon} />
              </div>
              <div className="font-semibold">{q.label}</div>
              <div className="text-xs text-muted mt-0.5">{q.desc}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(q.to);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-[color:var(--brand)] transition-snappy"
                aria-label={isFav(q.to) ? "Unfavorite" : "Favorite"}
              >
                <Icon name={isFav(q.to) ? "star" : "star"} className={isFav(q.to) ? "text-[color:var(--brand)]" : ""} />
              </button>
            </button>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Favorites */}
        <section className="card p-4 md:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Icon name="star" className="text-[color:var(--brand)]" /> Favorites
            </h2>
            <button
              className="text-xs text-muted hover:text-[color:var(--ink)]"
              onClick={() => { storage.addRecent({ kind: "resource", label: "Favorites opened" }); }}
            >
              Pin tools you use daily
            </button>
          </div>
          {favs.length === 0 ? (
            <EmptyFavs />
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {favs.map((f) => (
                <li key={f.id}>
                  <button
                    onClick={() => {
                      if (f.kind === "tool" || f.kind === "action") nav(f.target);
                      else {
                        window.open(f.target, "_blank", "noopener,noreferrer");
                        storage.addRecent({ kind: "resource", label: f.label });
                      }
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-[rgba(26,26,27,0.04)] transition-snappy text-left"
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ background: "var(--brand)" }}
                    >
                      <Icon name={f.icon} size="sm" />
                    </span>
                    <span className="flex-1 truncate font-medium">{f.label}</span>
                    <Icon name="chevron-right" className="text-muted" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Recent */}
        <section className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold flex items-center gap-2">
              <Icon name="clock-rotate-left" className="text-muted" /> Recent
            </h2>
          </div>
          {recents.length === 0 ? (
            <p className="text-sm text-muted leading-relaxed">
              Nothing here yet. Open a tool, print something, or calculate a price — your recent actions show up here.
            </p>
          ) : (
            <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
              {recents.map((r) => (
                <li key={r.id} className="flex items-center gap-3 py-2">
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-xs"
                    style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}
                  >
                    <Icon
                      name={
                        r.kind === "print"
                          ? "print"
                          : r.kind === "price"
                          ? "cash"
                          : r.kind === "resource"
                          ? "folder"
                          : "calculator"
                      }
                      size="sm"
                    />
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{r.label}</div>
                    <div className="text-[11px] text-muted">{timeAgo(r.createdAt)} {r.meta ? `· ${r.meta}` : ""}</div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>

      {/* Shortcut hint */}
      <section className="card p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 text-sm">
          <Icon name="keyboard" className="text-[color:var(--brand)]" />
          <span className="font-medium">Keyboard first</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span className="kbd">Ctrl K</span> Command search
          <span className="kbd">Ctrl V</span> Paste into Quick Print
          <span className="kbd">Ctrl P</span> Print
          <span className="kbd">ESC</span> Close panels
        </div>
      </section>
    </div>
  );
}

function EmptyFavs() {
  return (
    <div className="py-6 text-center">
      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
        <Icon name="star" />
      </div>
      <p className="text-sm text-muted">
        Star a quick action to pin it here. Fewer clicks every morning.
      </p>
    </div>
  );
}

// unused in this page — keep formatter imported for tree-shake safety
void format;
