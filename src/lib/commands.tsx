import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Icon } from "./icons";
import { useStorage } from "./storage-hooks";
import { storage } from "./storage";
import { useI18n } from "./i18n";
import { useOverlayMotion } from "./motion";
import { useDialogAccessibility } from "./dialog-accessibility";

export interface Command {
  id: string;
  label: string;
  hint?: string;
  icon: string;
  group: string;
  keywords?: string[];
  run: (ctx: CommandContext) => void | Promise<void>;
}

export interface CommandContext {
  navigate: (path: string) => void;
  openModal: (id: string) => void;
  openUrl: (url: string) => void;
}

type Listener = () => void;

class CommandRegistry {
  commands: Command[] = [];
  listeners = new Set<Listener>();
  register(cmd: Command) {
    this.commands.push(cmd);
    this.emit();
    return () => {
      this.commands = this.commands.filter((c) => c.id !== cmd.id);
      this.emit();
    };
  }
  emit() {
    this.listeners.forEach((l) => l());
  }
  subscribe(l: Listener) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
  search(q: string): Command[] {
    const query = q.trim().toLowerCase();
    if (!query) return this.commands;
    return this.commands
      .map((c) => {
        const hay = [c.label, c.hint ?? "", ...(c.keywords ?? [])].join(" ").toLowerCase();
        let score = 0;
        if (hay.startsWith(query)) score += 10;
        if (hay.includes(query)) score += 5;
        // token match
        const tokens = query.split(/\s+/).filter(Boolean);
        for (const t of tokens) if (hay.includes(t)) score += 1;
        return { c, score };
      })
      .filter((x) => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 20)
      .map((x) => x.c);
  }
}

export const registry = new CommandRegistry();

const PaletteContext = createContext<{
  open: () => void;
  close: () => void;
  isOpen: boolean;
}>({ open: () => {}, close: () => {}, isOpen: false });

export function useCommandPalette() {
  return useContext(PaletteContext);
}

export function CommandProvider({
  children,
  navigate,
  openModal,
}: {
  children: React.ReactNode;
  navigate: (path: string) => void;
  openModal: (id: string) => void;
}) {
  const [isOpen, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLDivElement>(null);
  useOverlayMotion(overlayRef, isOpen);
  const ctx: CommandContext = useMemo(
    () => ({
      navigate: (p) => {
        navigate(p);
        setOpen(false);
      },
      openModal: (id) => {
        openModal(id);
        setOpen(false);
      },
      openUrl: (url) => {
        window.open(url, "_blank", "noopener,noreferrer");
        storage.addRecent({ kind: "resource", label: url });
      },
    }),
    [navigate, openModal]
  );

  const { data } = useStorage();
  const { t, locale } = useI18n();
  const requestSheetPrint = useCallback(() => {
    setOpen(false);
    if (window.location.pathname === "/print") {
      window.dispatchEvent(new CustomEvent("rekaluna:print-sheet"));
      return;
    }
    navigate("/print");
  }, [navigate]);
  const isMobile = typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

  // Register global commands + resources
  useEffect(() => {
    const builtins: Command[] = [
      { id: "go-workspace", label: t("goWorkspace"), icon: "house", group: t("navigation"), run: (c) => c.navigate("/") },
      { id: "go-print", label: t("openQuickPrint"), icon: "print", group: t("navigation"), keywords: ["print", "cetak", "image"], run: (c) => c.navigate("/print") },
      { id: "go-price", label: t("openPriceDesk"), icon: "calculator", group: t("navigation"), keywords: ["price", "harga", "cash"], run: (c) => c.navigate("/price") },
      { id: "go-resources", label: t("openResourceCenter"), icon: "folder", group: t("navigation"), keywords: ["resources", "driver", "pdf"], run: (c) => c.navigate("/resources") },
      { id: "go-support", label: t("openSupportDonate"), icon: "heart", group: t("navigation"), keywords: ["donate", "support"], run: (c) => c.navigate("/support") },
      { id: "go-about", label: t("aboutRekalunaCommand"), icon: "info", group: t("navigation"), run: (c) => c.navigate("/about") },
      { id: "open-settings", label: t("openSettings"), icon: "gear", group: t("appGroup"), keywords: ["settings", "preferences"], run: (c) => c.openModal("settings") },
      { id: "trigger-print", label: t("triggerPrintCommand"), icon: "print", group: t("quickActionsGroup"), run: requestSheetPrint },
      { id: "paste-image", label: t("pasteImageCommand"), icon: "paste", group: t("quickActionsGroup"), keywords: ["clipboard", "paste"], run: (c) => c.navigate("/print") },
    ];
    const unsubs = builtins.map((b) => registry.register(b));
    return () => unsubs.forEach((u) => u());
  }, [locale, requestSheetPrint, t]);

  // Register resources as commands
  useEffect(() => {
    const unsubs = data.resources.map((r) =>
      registry.register({
        id: `res-${r.id}`,
        label: `Open ${r.name}`,
        hint: r.category,
        icon: r.category === "PDF" ? "file-pdf" : r.category === "Driver" ? "download" : r.category === "Image" ? "image" : "link",
        group: t("resourcesGroup"),
        keywords: [r.category, r.name],
        run: (c) => c.openUrl(r.url),
      })
    );
    const favs = data.favorites.map((f) =>
      registry.register({
        id: `fav-${f.id}`,
        label: `${t("favorite")}: ${f.label}`,
        icon: f.icon,
        group: t("favoritesGroup"),
        run: (c) => {
          if (f.kind === "tool" || f.kind === "action") c.navigate(f.target);
          else c.openUrl(f.target);
        },
      })
    );
    return () => {
      unsubs.forEach((u) => u());
      favs.forEach((u) => u());
    };
  }, [data.resources, data.favorites, locale, t]);

  const open = useCallback(() => {
    if (isMobile) {
      openModal("mobile-search");
      return;
    }
    setOpen(true);
    setQuery("");
    setActive(0);
  }, [isMobile, openModal]);

  const close = useCallback(() => setOpen(false), []);
  useDialogAccessibility(overlayRef, isOpen, close);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  // Keyboard shortcut
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isMobile) {
          openModal("mobile-search");
        } else if (isOpen) {
          close();
        } else {
          open();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        requestSheetPrint();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, isOpen, isMobile, openModal, requestSheetPrint]);

  const results = useMemo(() => registry.search(query), [query]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  const runActive = () => {
    const cmd = results[active];
    if (!cmd) return;
    cmd.run(ctx);
    setOpen(false);
  };

  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((a) => Math.min(results.length - 1, a + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((a) => Math.max(0, a - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      runActive();
    }
  };

  return (
    <PaletteContext.Provider value={{ isOpen, open, close }}>
      {children}
      {isOpen && (
        <div
          ref={overlayRef}
          className="fixed inset-0 z-50 backdrop flex items-start justify-center pt-[10vh] no-print"
          onClick={close}
        >
          <div
            className="card motion-panel w-full max-w-xl mx-4 overflow-hidden shadow-pop"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label={t("commandPalette")}
            tabIndex={-1}
          >
            <div className="flex items-center gap-3 px-4 py-3 border-b" style={{ borderColor: "var(--line)" }}>
              <Icon name="search" className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder={t("searchRekaluna")}
                className="flex-1 bg-transparent outline-none text-sm num"
                aria-label={t("search")}
              />
              <span className="kbd">ESC</span>
            </div>
            <div className="max-h-[50vh] overflow-auto py-1">
              {results.length === 0 && (
                <div className="px-4 py-8 text-center text-sm text-muted">
                  {t("noMatchesTry")}
                </div>
              )}
              {results.map((c, i) => (
                <button
                  key={c.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    c.run(ctx);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-snappy ${
                    i === active ? "bg-[rgba(156,28,38,0.08)]" : "hover:bg-[rgba(26,26,27,0.04)]"
                  }`}
                >
                  <span
                    className="w-7 h-7 rounded-lg flex items-center justify-center text-sm"
                    style={{
                      background: i === active ? "var(--brand)" : "color-mix(in srgb, var(--ink) 6%, transparent)",
                      color: i === active ? "#fff" : "var(--ink)",
                    }}
                  >
                    <Icon name={c.icon} />
                  </span>
                  <span className="flex-1">
                    <span className="font-medium">{c.label}</span>
                    {c.hint && <span className="ml-2 text-xs text-muted">{c.hint}</span>}
                  </span>
                  <span className="text-[11px] uppercase tracking-wide text-muted">{c.group}</span>
                </button>
              ))}
            </div>
            <div
              className="flex items-center justify-between px-4 py-2 text-[11px] text-muted border-t"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="flex items-center gap-2">
                <span className="kbd">↑↓</span> {t("navigate").toLowerCase()}
                <span className="kbd">↵</span> {t("runCommand")}
                <span className="kbd">Ctrl K</span> open
              </span>
              <span>{t("commandPalette")}</span>
            </div>
          </div>
        </div>
      )}
    </PaletteContext.Provider>
  );
}
