import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Icon } from "./icons";
import { useStorage } from "../hooks/useStorage";
import { storage } from "./storage";
import type { ResourceLink } from "../types";

// ── Types ──

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

// ── Registry ──

type Listener = () => void;

class CommandRegistry {
  private _commands: Command[] = [];
  private _listeners = new Set<Listener>();

  register(cmd: Command) {
    this._commands.push(cmd);
    this._emit();
    return () => {
      this._commands = this._commands.filter((c) => c.id !== cmd.id);
      this._emit();
    };
  }

  private _emit() {
    this._listeners.forEach((l) => l());
  }

  subscribe(l: Listener) {
    this._listeners.add(l);
    return () => this._listeners.delete(l);
  }

  search(q: string): Command[] {
    const query = q.trim().toLowerCase();
    if (!query) return this._commands;
    return this._commands
      .map((c) => {
        const hay = [c.label, c.hint ?? "", ...(c.keywords ?? [])]
          .join(" ")
          .toLowerCase();
        let score = 0;
        if (hay.startsWith(query)) score += 10;
        if (hay.includes(query)) score += 5;
        const tokens = query.split(/\s+/).filter(Boolean);
        for (const t of tokens) if (hay.includes(t)) score += 1;
        return { c, score };
      })
      .filter((x: { c: Command; score: number }) => x.score > 0)
      .sort((a: { c: Command; score: number }, b: { c: Command; score: number }) => b.score - a.score)
      .slice(0, 20)
      .map((x: { c: Command; score: number }) => x.c);
  }
}

export const registry = new CommandRegistry();

// ── Context ──

const PaletteCtx = createContext<{
  open: () => void;
  close: () => void;
  isOpen: boolean;
}>({ open: () => {}, close: () => {}, isOpen: false });

export function useCommandPalette() {
  return useContext(PaletteCtx);
}

// ── Provider ──

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
  const { data } = useStorage();

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

  // Register built-in commands
  useEffect(() => {
    const builtins: Command[] = [
      {
        id: "go-home",
        label: "Go to Workspace",
        icon: "house",
        group: "Navigate",
        run: (c) => c.navigate("/"),
      },
      {
        id: "go-print",
        label: "Open Print Studio",
        icon: "print",
        group: "Navigate",
        keywords: ["print", "cetak", "image", "gambar"],
        run: (c) => c.navigate("/print"),
      },
      {
        id: "go-price",
        label: "Open Price Desk",
        icon: "calculator",
        group: "Navigate",
        keywords: ["price", "harga", "cash", "uang"],
        run: (c) => c.navigate("/price"),
      },
      {
        id: "go-tools",
        label: "Open Toolbox",
        icon: "tools",
        group: "Navigate",
        keywords: ["tools", "resources", "driver", "pdf", "toolbox"],
        run: (c) => c.navigate("/tools"),
      },
      {
        id: "go-templates",
        label: "Open Templates",
        icon: "layers",
        group: "Navigate",
        keywords: ["template", "pas foto", "a4", "foto"],
        run: (c) => c.navigate("/templates"),
      },
      {
        id: "cmd-settings",
        label: "Open Settings",
        icon: "gear",
        group: "App",
        keywords: ["settings", "preferences", "pengaturan"],
        run: (c) => c.openModal("settings"),
      },
      {
        id: "cmd-print",
        label: "Trigger Print (Ctrl+P)",
        icon: "print",
        group: "Actions",
        run: () => setTimeout(() => window.print(), 50),
      },
      {
        id: "cmd-paste",
        label: "Paste image to Print Studio",
        icon: "paste",
        group: "Actions",
        keywords: ["clipboard", "paste"],
        run: (c) => c.navigate("/print"),
      },
      {
        id: "cmd-toggle-theme",
        label: "Toggle Dark Mode",
        icon: "moon",
        group: "App",
        keywords: ["dark", "theme", "tema", "gelap"],
        run: () => {
          const s = storage.getAll().settings;
          const next = s.theme === "dark" ? "light" : "dark";
          storage.update((d) => ({ ...d, settings: { ...d.settings, theme: next } }));
          const root = document.documentElement;
          root.classList.toggle("dark", next === "dark");
          root.style.colorScheme = next;
        },
      },
    ];

    const unsubs = builtins.map((b) => registry.register(b));
    return () => unsubs.forEach((u) => u());
  }, []);

  // Register resources as commands
  useEffect(() => {
    const unsubs = data.resources.map((r: ResourceLink) =>
      registry.register({
        id: `res-${r.id}`,
        label: `Open ${r.name}`,
        hint: r.category,
        icon: r.category === "PDF" ? "file-pdf" : r.category === "Driver" ? "download" : r.category === "Image" ? "image" : r.category === "Screenshot" ? "crop" : "link",
        group: "Resources",
        keywords: [r.category, r.name],
        run: (c) => c.openUrl(r.url),
      })
    );
    return () => unsubs.forEach((u: () => void) => u());
  }, [data.resources]);

  const open = useCallback(() => {
    setOpen(true);
    setQuery("");
    setActive(0);
    setTimeout(() => inputRef.current?.focus(), 10);
  }, []);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (isOpen) {
          close();
        } else {
          open();
        }
      } else if (e.key === "Escape" && isOpen) {
        close();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close, isOpen]);

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
    <PaletteCtx.Provider value={{ isOpen, open, close }}>
      {children}
      {isOpen && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center pt-[12vh] no-print fade-in"
          style={{ background: "rgba(10,10,10,0.4)" }}
          onClick={close}
          role="dialog"
          aria-modal="true"
          aria-label="Command palette"
        >
          <div
            className="card w-full max-w-[520px] mx-4 overflow-hidden shadow-pop"
            onClick={(e) => e.stopPropagation()}
          >
            <div
              className="flex items-center gap-3 px-4 py-3 border-b"
              style={{ borderColor: "var(--line)" }}
            >
              <Icon name="search" className="text-muted" />
              <input
                ref={inputRef}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onKeyDown}
                placeholder="Search commands, tools, resources..."
                className="flex-1 bg-transparent outline-none text-sm"
                aria-label="Search commands"
              />
              <span className="kbd">ESC</span>
            </div>

            <div className="max-h-[420px] overflow-auto py-1">
              {results.length === 0 && (
                <div className="px-4 py-10 text-center text-sm text-muted">
                  No matches found.
                </div>
              )}
              {results.map((c: Command, i: number) => (
                <button
                  key={c.id}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => {
                    c.run(ctx);
                    setOpen(false);
                  }}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 text-sm text-left transition-snappy ${
                    i === active
                      ? "bg-[rgba(156,28,38,0.08)]"
                      : "hover:bg-[rgba(26,26,27,0.04)]"
                  }`}
                >
                  <span
                    className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
                    style={{
                      background:
                        i === active
                          ? "var(--brand)"
                          : "color-mix(in srgb, var(--ink) 6%, transparent)",
                      color: i === active ? "#fff" : "var(--ink)",
                    }}
                  >
                    <Icon name={c.icon} size="sm" />
                  </span>
                  <span className="flex-1 text-left">
                    <span className="font-medium">{c.label}</span>
                    {c.hint && (
                      <span className="ml-2 text-xs text-muted">{c.hint}</span>
                    )}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide text-muted font-medium">
                    {c.group}
                  </span>
                </button>
              ))}
            </div>

            <div
              className="flex items-center justify-between px-4 py-2 text-[11px] text-muted border-t"
              style={{ borderColor: "var(--line)" }}
            >
              <span className="flex items-center gap-2">
                <span className="kbd">↑↓</span> navigate
                <span className="kbd">↵</span> run
              </span>
              <span className="text-xs">Rekaluna</span>
            </div>
          </div>
        </div>
      )}
    </PaletteCtx.Provider>
  );
}
