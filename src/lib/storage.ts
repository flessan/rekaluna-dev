// ── Rekaluna Storage — centralized localStorage layer ──

import type {
  AppData,
  AppSettings,
  PrintService,
  Favorite,
  RecentActivity,
  ResourceLink,
  Template,
} from "../types";

// Re-export types for convenience
export type { AppData, AppSettings, PrintService, Favorite, RecentActivity, ResourceLink, Template };
export type { ThemeMode } from "../types";

// ── Defaults ──

const DEFAULT_QUICK_MONEY = [250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

const DEFAULT_SERVICES: PrintService[] = [
  { id: "svc-bw", name: "Print B/W", price: 500 },
  { id: "svc-color", name: "Print Color", price: 1000 },
  { id: "svc-copy-bw", name: "Copy B/W", price: 250 },
  { id: "svc-copy-color", name: "Copy Color", price: 500 },
  { id: "svc-scan", name: "Scan", price: 500 },
  { id: "svc-laminate", name: "Lamination", price: 3000 },
];

const DEFAULT_TEMPLATES: Template[] = [
  {
    id: "tpl-passport-4x6",
    name: "Pas Foto 4×6",
    description: "4 pieces on 4R paper (10×15cm)",
    icon: "id-card",
    paper: "4R",
    orientation: "portrait",
    layout: "grid",
    rows: 4,
    cols: 2,
  },
  {
    id: "tpl-passport-3x4",
    name: "Pas Foto 3×4",
    description: "6 pieces on 4R paper (10×15cm)",
    icon: "id-card",
    paper: "4R",
    orientation: "portrait",
    layout: "grid",
    rows: 3,
    cols: 2,
  },
  {
    id: "tpl-passport-2x3",
    name: "Pas Foto 2×3",
    description: "8 pieces on 4R paper (10×15cm)",
    icon: "id-card",
    paper: "4R",
    orientation: "portrait",
    layout: "grid",
    rows: 4,
    cols: 2,
  },
  {
    id: "tpl-a4-photos",
    name: "A4 Photo Sheet",
    description: "Multiple photos fit on one A4",
    icon: "images",
    paper: "A4",
    orientation: "portrait",
    layout: "grid",
    rows: 3,
    cols: 2,
  },
  {
    id: "tpl-label",
    name: "Label Sheet",
    description: "Standard label layout on A4",
    icon: "tag",
    paper: "A4",
    orientation: "portrait",
    layout: "grid",
    rows: 5,
    cols: 2,
  },
];

const DEFAULT_RESOURCES: ResourceLink[] = [
  {
    id: "res-epson",
    name: "Epson Printer Drivers",
    url: "https://www.epson.co.id/Support/Printers/sh/s1",
    category: "Driver",
  },
  {
    id: "res-canon",
    name: "Canon Printer Drivers",
    url: "https://id.canon/en/support/download",
    category: "Driver",
  },
  {
    id: "res-hp",
    name: "HP Printer Drivers",
    url: "https://support.hp.com/drivers/printers",
    category: "Driver",
  },
  {
    id: "res-brother",
    name: "Brother Printer Drivers",
    url: "https://support.brother.com/g/b/productsearch.aspx?c=id&lang=en",
    category: "Driver",
  },
  {
    id: "res-ilovepdf",
    name: "iLovePDF",
    url: "https://www.ilovepdf.com/",
    category: "PDF",
  },
  {
    id: "res-smallpdf",
    name: "Smallpdf",
    url: "https://smallpdf.com/",
    category: "PDF",
  },
  {
    id: "res-pdfescape",
    name: "PDFescape",
    url: "https://www.pdfescape.com/",
    category: "PDF",
  },
  {
    id: "res-tinypng",
    name: "TinyPNG",
    url: "https://tinypng.com/",
    category: "Image",
  },
  {
    id: "res-removebg",
    name: "Remove.bg",
    url: "https://www.remove.bg/",
    category: "Image",
  },
  {
    id: "res-photopea",
    name: "Photopea",
    url: "https://www.photopea.com/",
    category: "Image",
  },
  {
    id: "res-lightshot",
    name: "Lightshot",
    url: "https://app.prntscr.com/",
    category: "Screenshot",
  },
  {
    id: "res-sharex",
    name: "ShareX",
    url: "https://getsharex.com/",
    category: "Screenshot",
  },
  {
    id: "res-qrcode",
    name: "QR Code Generator",
    url: "https://www.qr-code-generator.com/",
    category: "Utility",
  },
  {
    id: "res-ninite",
    name: "Ninite (Fast PC Setup)",
    url: "https://ninite.com/",
    category: "Utility",
  },
];

const DEFAULT_FAVORITES: Favorite[] = [
  { id: "/print", kind: "tool", label: "Print Studio", icon: "print", target: "/print" },
  { id: "/price", kind: "tool", label: "Price Desk", icon: "calculator", target: "/price" },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  print: {
    paper: "A4",
    orientation: "portrait",
    copies: 1,
    scaling: "fit",
    margin: "normal",
  },
  quickMoney: DEFAULT_QUICK_MONEY,
  counterMode: false,
};

const DEFAULT_DATA: AppData = {
  settings: DEFAULT_SETTINGS,
  services: DEFAULT_SERVICES,
  favorites: DEFAULT_FAVORITES,
  recents: [],
  resources: DEFAULT_RESOURCES,
  templates: DEFAULT_TEMPLATES,
  printQueue: [],
  clipboard: [],
};

const STORAGE_KEY = "rekaluna:v2";

// ── Read / Write ──

function read(): AppData {
  if (typeof window === "undefined") return structuredClone(DEFAULT_DATA);
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as Partial<AppData>;
    return {
      settings: {
        ...DEFAULT_SETTINGS,
        ...(parsed.settings ?? {}),
        print: { ...DEFAULT_SETTINGS.print, ...(parsed.settings?.print ?? {}) },
        quickMoney: parsed.settings?.quickMoney ?? DEFAULT_SETTINGS.quickMoney,
      },
      services: parsed.services?.length ? parsed.services : DEFAULT_SERVICES,
      favorites: parsed.favorites ?? DEFAULT_FAVORITES,
      recents: parsed.recents ?? [],
      resources: parsed.resources ?? DEFAULT_RESOURCES,
      templates: parsed.templates ?? DEFAULT_TEMPLATES,
      printQueue: parsed.printQueue ?? [],
      clipboard: parsed.clipboard ?? [],
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function write(data: AppData) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("rekaluna:storage", { detail: data }));
  } catch (e) {
    console.warn("Rekaluna storage write failed", e);
  }
}

let cache: AppData | null = null;

// ── Public API ──

export const storage = {
  getAll(): AppData {
    if (!cache) cache = read();
    return cache;
  },

  setAll(next: AppData) {
    cache = next;
    write(next);
  },

  update(fn: (data: AppData) => AppData): AppData {
    const next = fn(this.getAll());
    this.setAll(next);
    return next;
  },

  reset(): AppData {
    cache = structuredClone(DEFAULT_DATA);
    write(cache);
    return cache;
  },

  export(): string {
    return JSON.stringify(this.getAll(), null, 2);
  },

  import(text: string): boolean {
    try {
      const parsed = JSON.parse(text) as Partial<AppData>;
      if (typeof parsed !== "object" || !parsed) return false;
      this.setAll({
        settings: {
          ...DEFAULT_SETTINGS,
          ...parsed.settings,
          print: { ...DEFAULT_SETTINGS.print, ...(parsed.settings?.print ?? {}) },
          quickMoney: parsed.settings?.quickMoney ?? DEFAULT_SETTINGS.quickMoney,
        },
        services: Array.isArray(parsed.services) && parsed.services.length ? parsed.services : DEFAULT_SERVICES,
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULT_FAVORITES,
        recents: Array.isArray(parsed.recents) ? parsed.recents : [],
        resources: Array.isArray(parsed.resources) ? parsed.resources : DEFAULT_RESOURCES,
        templates: Array.isArray(parsed.templates) ? parsed.templates : DEFAULT_TEMPLATES,
        printQueue: Array.isArray(parsed.printQueue) ? parsed.printQueue : [],
        clipboard: Array.isArray(parsed.clipboard) ? parsed.clipboard : [],
      });
      return true;
    } catch {
      return false;
    }
  },

  addRecent(item: Omit<RecentActivity, "id" | "createdAt">) {
    const all = this.getAll();
    const entry: RecentActivity = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    const next = [entry, ...all.recents.filter((r: RecentActivity) => r.label !== item.label)].slice(0, 20);
    this.setAll({ ...all, recents: next });
  },
};

// ── Helpers ──

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

// ── Currency formatter (Indonesian Rupiah) ──

const rupiahFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numericFormatter = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const fmt = {
  rupiah(n: number): string {
    if (!Number.isFinite(n)) return rupiahFormatter.format(0);
    return rupiahFormatter.format(Math.round(n));
  },
  number(n: number): string {
    if (!Number.isFinite(n)) return "0";
    return numericFormatter.format(Math.round(n));
  },
  parse(input: string): number {
    if (input == null) return 0;
    const cleaned = String(input).replace(/[^0-9,-]/g, "").replace(/,/g, ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  },
};
