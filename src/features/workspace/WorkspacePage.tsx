import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../../lib/icons";
import { useStorage } from "../../hooks/useStorage";
import { storage } from "../../lib/storage";
import type { Favorite, RecentActivity } from "../../lib/storage";

// ── Greeting ──

function greeting(): string {
  const h = new Date().getHours();
  if (h < 10) return "Good morning";
  if (h < 15) return "Good afternoon";
  if (h < 19) return "Good evening";
  return "Welcome back";
}

// ── Time ago ──

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

// ── Quick actions ──

const QUICK_ACTIONS = [
  { to: "/print", label: "Print Studio", icon: "print", desc: "Paste, preview, and print images" },
  { to: "/price", label: "Price Desk", icon: "calculator", desc: "Fast printing price calculator" },
  { to: "/tools", label: "Toolbox", icon: "tools", desc: "Drivers, PDF tools, and utilities" },
  { to: "/templates", label: "Templates", icon: "layers", desc: "Passport photos, labels, sheets" },
];

// ── Page ──

export default function WorkspacePage() {
  const { data, update } = useStorage();
  const nav = useNavigate();

  const favs = data.favorites;
  const recents = useMemo(() => data.recents.slice(0, 8), [data.recents]);
  const queued = useMemo(() => data.printQueue.length, [data.printQueue]);

  const toggleFavorite = (id: string) => {
    update((d) => {
      const exists = d.favorites.find((f: Favorite) => f.id === id);
      if (exists) {
        return { ...d, favorites: d.favorites.filter((f: Favorite) => f.id !== id) };
      }
      const action = QUICK_ACTIONS.find((q) => q.to === id);
      return {
        ...d,
        favorites: [
          ...d.favorites,
          {
            id,
            kind: "tool" as const,
            label: action?.label ?? "Tool",
            icon: action?.icon ?? "star",
            target: id,
          },
        ],
      };
    });
  };

  const isFav = (id: string) => favs.some((f: Favorite) => f.id === id);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Greeting */}
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
            {greeting()}.
          </h1>
          <p className="text-sm text-muted mt-1">
            Every essential tool. Zero friction.
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted">
          <span
            className="w-2 h-2 rounded-full inline-block"
            style={{ background: "var(--brand)" }}
          />
          Local-only · nothing leaves this device
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <h2 className="label mb-3">Quick Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {QUICK_ACTIONS.map((q) => (
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
              <div className="font-semibold text-sm">{q.label}</div>
              <div className="text-xs text-muted mt-0.5">{q.desc}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(q.to);
                }}
                className={`absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center transition-snappy ${
                  isFav(q.to)
                    ? "text-[color:var(--brand)]"
                    : "text-muted hover:text-[color:var(--brand)]"
                }`}
                aria-label={isFav(q.to) ? "Unfavorite" : "Favorite"}
              >
                <Icon name="star" />
              </button>
            </button>
          ))}
        </div>
      </section>

      <div className="grid md:grid-cols-3 gap-4">
        {/* Favorites */}
        <section className="card p-4 md:col-span-2">
          <h2 className="font-semibold flex items-center gap-2 mb-3">
            <span style={{ color: "var(--brand)" }}>
              <Icon name="star" />
            </span>
            Favorites
          </h2>
          {favs.length === 0 ? (
            <div className="py-8 text-center">
              <div
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                style={{
                  background: "color-mix(in srgb, var(--brand) 10%, transparent)",
                  color: "var(--brand)",
                }}
              >
                <Icon name="star" />
              </div>
              <p className="text-sm text-muted">
                Star a quick action to pin it here. Fewer clicks every day.
              </p>
            </div>
          ) : (
            <ul className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {favs.map((f: Favorite) => (
                <li key={f.id}>
                  <button
                    onClick={() => {
                      if (f.kind === "tool") nav(f.target);
                      else {
                        window.open(f.target, "_blank", "noopener,noreferrer");
                        storage.addRecent({ kind: "resource", label: f.label });
                      }
                    }}
                    className="w-full flex items-center gap-2.5 rounded-lg px-3 py-2.5 text-sm hover:bg-[rgba(26,26,27,0.04)] transition-snappy text-left"
                  >
                    <span
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white shrink-0"
                      style={{ background: "var(--brand)" }}
                    >
                      <Icon name={f.icon} size="sm" />
                    </span>
                    <span className="flex-1 truncate font-medium">{f.label}</span>
                    <Icon name="chevron-right" className="text-muted shrink-0" size="sm" />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        {/* Status panel */}
        <section className="space-y-3">
          {/* Recent activity */}
          <div className="card p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-3">
              <Icon name="clock-rotate-left" className="text-muted" />
              Recent
            </h2>
            {recents.length === 0 ? (
              <p className="text-sm text-muted leading-relaxed">
                Your recent actions will appear here.
              </p>
            ) : (
              <ul className="divide-y" style={{ borderColor: "var(--line)" }}>
                {recents.map((r: RecentActivity) => (
                  <li key={r.id} className="flex items-center gap-3 py-2">
                    <span
                      className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{
                        background: "color-mix(in srgb, var(--brand) 10%, transparent)",
                        color: "var(--brand)",
                      }}
                    >
                      <Icon
                        name={
                          r.kind === "print"
                            ? "print"
                            : r.kind === "price"
                              ? "calculator"
                              : r.kind === "resource"
                                ? "folder"
                                : "calculator"
                        }
                        size="sm"
                      />
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate">{r.label}</div>
                      <div className="text-[11px] text-muted">
                        {timeAgo(r.createdAt)}
                        {r.detail ? ` · ${r.detail}` : ""}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Print Queue summary */}
          <div className="card p-4">
            <h2 className="font-semibold flex items-center gap-2 mb-2">
              <Icon name="inbox" className="text-muted" />
              Print Queue
            </h2>
            <p className="text-2xl font-bold num" style={{ color: "var(--brand)" }}>
              {queued}
            </p>
            <p className="text-xs text-muted mt-0.5">
              {queued === 0
                ? "No pending print jobs"
                : `${queued} job${queued > 1 ? "s" : ""} waiting`}
            </p>
          </div>
        </section>
      </div>

      {/* Keyboard hint */}
      <section className="card p-4 flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <div className="flex items-center gap-2 text-sm">
          <span style={{ color: "var(--brand)" }}>
            <Icon name="keyboard" />
          </span>
          <span className="font-medium">Keyboard Shortcuts</span>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted">
          <span>
            <span className="kbd">Ctrl K</span> Search
          </span>
          <span>
            <span className="kbd">Ctrl V</span> Paste image
          </span>
          <span>
            <span className="kbd">Ctrl P</span> Print
          </span>
          <span>
            <span className="kbd">ESC</span> Close
          </span>
        </div>
      </section>
    </div>
  );
}
