import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { useStorage } from "../lib/storage-hooks";
import { format, storage } from "../lib/storage";
import { useI18n } from "../lib/i18n";

function greetingKey() {
  const hour = new Date().getHours();
  if (hour < 11) return "morning" as const;
  if (hour < 15) return "afternoon" as const;
  if (hour < 20) return "evening" as const;
  return "welcomeBack" as const;
}

const QUICK = [
  { to: "/print", label: "quickPrint", icon: "print", desc: "quickPrintDesc" },
  { to: "/price", label: "Price Desk", icon: "calculator", desc: "Answer 'How much?' fast." },
  { to: "/resources", label: "resources", icon: "folder", desc: "resourcesDesc" },
  { to: "/support", label: "support", icon: "heart", desc: "supportDesc" },
];

function timeAgo(ts: number, locale: "en" | "id"): string {
  const s = Math.floor((Date.now() - ts) / 1000);
  if (s < 60) return locale === "id" ? "baru saja" : "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return locale === "id" ? m + " menit lalu" : `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return locale === "id" ? h + " jam lalu" : `${h}h ago`;
  const d = Math.floor(h / 24);
  return locale === "id" ? d + " hari lalu" : `${d}d ago`;
}

export default function WorkspacePage() {
  const { data, update } = useStorage();
  const nav = useNavigate();
  const { t, locale } = useI18n();

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
          label: (() => { const quick = QUICK.find((q) => q.to === id); return quick ? t(quick.label as any) : t("favorite"); })(),
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
          <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t(greetingKey())}</h1>
          <p className="text-sm text-muted mt-1">
            {t("workspaceTagline")}
          </p>
        </div>
        <div className="hidden md:flex items-center gap-2 text-xs text-muted">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          {t("localOnly")}
        </div>
      </div>

      {/* Quick actions */}
      <section>
        <div className="flex items-center justify-between mb-2">
          <h2 className="label">{t("quickActions")}</h2>
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
              <div className="font-semibold">{t(q.label as any)}</div>
              <div className="text-xs text-muted mt-0.5">{t(q.desc as any)}</div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFavorite(q.to);
                }}
                className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-muted hover:text-[color:var(--brand)] transition-snappy"
                aria-label={isFav(q.to) ? t("unfavorite") : t("favorite")}
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
              <Icon name="star" className="text-[color:var(--brand)]" /> {t("favorites")}
            </h2>
            <button
              className="text-xs text-muted hover:text-[color:var(--ink)]"
              onClick={() => { storage.addRecent({ kind: "resource", label: "Favorites opened" }); }}
            >
              {t("pinDaily")}
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
              <Icon name="clock-rotate-left" className="text-muted" /> {t("recent")}
            </h2>
          </div>
          {recents.length === 0 ? (
            <p className="text-sm text-muted leading-relaxed">
              {t("nothingRecent")}
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
                    <div className="text-[11px] text-muted">{timeAgo(r.createdAt, locale)} {r.meta ? `· ${r.meta}` : ""}</div>
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
          <span className="font-medium">{t("keyboardFirst")}</span>
        </div>
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          <span className="kbd">Ctrl K</span> {t("commandSearch")}
          <span className="kbd">Ctrl V</span> {t("pasteIntoPrint")}
          <span className="kbd">Ctrl P</span> {t("print")}
          <span className="kbd">ESC</span> {t("closePanels")}
        </div>
      </section>
    </div>
  );
}

function EmptyFavs() {
  const { t } = useI18n();
  return (
    <div className="py-6 text-center">
      <div className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-2" style={{ background: "color-mix(in srgb, var(--brand) 10%, transparent)", color: "var(--brand)" }}>
        <Icon name="star" />
      </div>
      <p className="text-sm text-muted">
        {t("noFavorites")}
      </p>
    </div>
  );
}

// unused in this page - keep formatter imported for tree-shake safety
void format;
