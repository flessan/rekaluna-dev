import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Icon } from "../lib/icons";
import { useCommandPalette } from "../lib/commands";
import clsx from "clsx";
import type { ReactNode } from "react";

// ── Navigation definitions ──

const DESKTOP_NAV = [
  { to: "/", label: "Workspace", icon: "house" },
  { to: "/print", label: "Print Studio", icon: "print" },
  { to: "/price", label: "Price Desk", icon: "calculator" },
  { to: "/tools", label: "Toolbox", icon: "tools" },
  { to: "/templates", label: "Templates", icon: "layers" },
];

const MOBILE_NAV = [
  { to: "/", label: "Workspace", icon: "house" },
  { to: "/price", label: "Price", icon: "calculator" },
  { to: "/tools", label: "Tools", icon: "tools" },
  { to: "/__more", label: "More", icon: "ellipsis" },
];

// ── Component ──

export function AppShell({
  children,
  onOpenModal,
}: {
  children: ReactNode;
  onOpenModal: (id: string) => void;
}) {
  const loc = useLocation();
  const nav = useNavigate();
  const palette = useCommandPalette();

  const currentTitle =
    [...DESKTOP_NAV].find((n) => n.to === loc.pathname)?.label ?? "Rekaluna";

  return (
    <div className="min-h-full flex flex-col">
      {/* ═══════════ Desktop Layout ═══════════ */}
      <div className="hidden md:flex min-h-screen">
        {/* Sidebar */}
        <aside
          className="w-60 shrink-0 border-r flex flex-col"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          {/* Logo */}
          <div className="px-5 py-5 flex items-center gap-3">
            <div
              className="w-9 h-9 rounded-lg flex items-center justify-center text-white font-bold"
              style={{ background: "var(--brand)" }}
            >
              <Icon name="print" />
            </div>
            <div>
              <div className="font-bold tracking-tight leading-none text-base">
                Rekaluna
              </div>
              <div className="text-[11px] text-muted mt-0.5">Print Workspace</div>
            </div>
          </div>

          {/* Navigation links */}
          <nav className="px-3 flex-1">
            <div className="px-2 pt-2 pb-1 label">Main Menu</div>
            <ul className="space-y-0.5">
              {DESKTOP_NAV.map((n) => (
                <li key={n.to}>
                  <NavLink
                    to={n.to}
                    end={n.to === "/"}
                    className={({ isActive }) =>
                      clsx(
                        "flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-snappy",
                        isActive
                          ? "bg-[rgba(156,28,38,0.08)] text-[color:var(--brand)] font-semibold"
                          : "hover:bg-[rgba(26,26,27,0.04)]"
                      )
                    }
                  >
                    <Icon name={n.icon} />
                    <span>{n.label}</span>
                  </NavLink>
                </li>
              ))}
            </ul>

            {/* Quick section */}
            <div className="px-2 pt-5 pb-1 label">Quick Access</div>
            <button
              onClick={() => palette.open()}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[rgba(26,26,27,0.04)] text-left"
            >
              <Icon name="search" />
              <span className="flex-1">Search Commands</span>
              <span className="kbd">Ctrl K</span>
            </button>
            <button
              onClick={() => nav("/print")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[rgba(26,26,27,0.04)] text-left mt-0.5"
            >
              <Icon name="paste" />
              <span className="flex-1">Paste Image</span>
              <span className="kbd">Ctrl V</span>
            </button>
          </nav>

          {/* Footer */}
          <div className="p-3 border-t" style={{ borderColor: "var(--line)" }}>
            <button
              onClick={() => onOpenModal("settings")}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm hover:bg-[rgba(26,26,27,0.04)]"
            >
              <Icon name="gear" />
              Settings
            </button>
            <div className="px-3 pt-3 text-[11px] text-muted leading-relaxed">
              Local-first · Offline ready · MIT
            </div>
          </div>
        </aside>

        {/* Main content */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header
            className="h-14 px-6 border-b flex items-center gap-3 sticky top-0 z-20 no-print"
            style={{
              borderColor: "var(--line)",
              background: "color-mix(in srgb, var(--canvas) 85%, transparent)",
              backdropFilter: "blur(8px)",
            }}
          >
            <span className="text-sm font-medium text-muted">{currentTitle}</span>
            <div className="flex-1" />
            <button
              onClick={() => palette.open()}
              className="hidden md:flex items-center gap-2 px-3 h-9 rounded-lg border text-sm text-muted w-[280px] hover:border-[color:var(--brand)] transition-snappy"
              style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            >
              <Icon name="search" size="sm" />
              <span className="flex-1 text-left">Search Rekaluna…</span>
              <span className="kbd">Ctrl K</span>
            </button>
            <button
              onClick={() => nav("/print")}
              className="btn btn-primary"
              title="Quick Print"
            >
              <Icon name="print" /> Print Studio
            </button>
          </header>
          <main className="flex-1 px-6 py-6 fade-in" key={loc.pathname}>
            {children}
          </main>
        </div>
      </div>

      {/* ═══════════ Mobile Layout ═══════════ */}
      <div className="md:hidden flex flex-col min-h-screen pb-[calc(4.5rem+env(safe-area-inset-bottom))]">
        {/* Mobile header */}
        <header
          className="h-14 px-4 border-b flex items-center gap-3 sticky top-0 z-20 no-print"
          style={{ borderColor: "var(--line)", background: "var(--surface)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center text-white font-bold"
            style={{ background: "var(--brand)" }}
          >
            <Icon name="print" />
          </div>
          <div className="font-semibold tracking-tight">{currentTitle}</div>
          <div className="flex-1" />
          <button
            onClick={() => palette.open()}
            className="w-9 h-9 rounded-lg flex items-center justify-center border"
            style={{ borderColor: "var(--line)", background: "var(--surface)" }}
            aria-label="Search"
          >
            <Icon name="search" />
          </button>
        </header>

        <main className="flex-1 px-4 py-4 fade-in" key={loc.pathname + ":m"}>
          {children}
        </main>

        {/* FAB — Print Studio quick access */}
        {loc.pathname !== "/print" && (
          <button
            onClick={() => nav("/print")}
            className="fixed z-30 right-4 bottom-[calc(5.5rem+env(safe-area-inset-bottom))] w-14 h-14 rounded-2xl text-white shadow-pop flex items-center justify-center active:scale-95 transition-snappy"
            style={{ background: "var(--brand)" }}
            aria-label="Print Studio"
          >
            <Icon name="print" size="lg" />
          </button>
        )}

        {/* Bottom navigation */}
        <nav
          className="fixed bottom-0 inset-x-0 z-30 border-t flex items-stretch no-print"
          style={{
            borderColor: "var(--line)",
            background: "var(--surface)",
            paddingBottom: "env(safe-area-inset-bottom)",
          }}
        >
          {MOBILE_NAV.map((n) => {
            if (n.to === "/__more") {
              return (
                <button
                  key="more"
                  onClick={() => onOpenModal("more")}
                  className="flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] text-muted"
                >
                  <Icon name="ellipsis" className="text-lg" />
                  <span>More</span>
                </button>
              );
            }
            const isActive = n.to === "/"
              ? loc.pathname === "/"
              : loc.pathname.startsWith(n.to);
            return (
              <NavLink
                key={n.to}
                to={n.to}
                end={n.to === "/"}
                className={clsx(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 py-2.5 text-[11px] transition-snappy",
                  isActive
                    ? "text-[color:var(--brand)] font-semibold"
                    : "text-muted"
                )}
              >
                <Icon name={n.icon} className="text-lg" />
                <span>{n.label}</span>
              </NavLink>
            );
          })}
        </nav>
      </div>
    </div>
  );
}
