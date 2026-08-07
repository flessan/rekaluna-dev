// Centralized local storage layer for Rekaluna.
// All persistence goes through here so nothing is scattered across the app.

export type ThemeMode = "light" | "dark" | "system";

export interface PrintPrefs {
  paper: "A4" | "F4" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  copies: number;
  scaling: "fit" | "fill" | "original";
  margin: "none" | "small" | "normal" | "large";
}

export interface Service {
  id: string;
  name: string;
  price: number;
  color?: string;
}

export type TransactionItem = {
  id: string;
  serviceId?: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  createdAt: number;
};

export type FavoriteKind = "tool" | "resource" | "action";
export interface Favorite {
  id: string;
  kind: FavoriteKind;
  label: string;
  icon: string;
  target: string; // route or action key
}

export interface RecentItem {
  id: string;
  kind: "print" | "price" | "resource" | "calc";
  label: string;
  meta?: string;
  createdAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  print: PrintPrefs;
  quickMoney: number[];
}

export interface AppData {
  settings: AppSettings;
  services: Service[];
  favorites: Favorite[];
  recents: RecentItem[];
  resources: ResourceLink[];
}

export interface ResourceLink {
  id: string;
  name: string;
  url: string;
  category: string;
  note?: string;
}

const KEY = "rekaluna:v1";

const DEFAULT_QUICK_MONEY = [250, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000];

const DEFAULT_SERVICES: Service[] = [
  { id: "svc-bw", name: "Print Black & White", price: 500 },
  { id: "svc-color", name: "Print Color", price: 1000 },
  { id: "svc-copy-bw", name: "Photocopy Black & White", price: 250 },
  { id: "svc-copy-color", name: "Photocopy Color", price: 500 },
  { id: "svc-scan", name: "Scan", price: 500 },
  { id: "svc-laminate", name: "Lamination", price: 3000 },
];

const DEFAULT_RESOURCES: ResourceLink[] = [
  { id: "res-epson-l3210", name: "Epson L3210 Driver", url: "https://support.epson.net/setupnavi/mira/navi/l3210/", category: "Driver" },
  { id: "res-canonsetup", name: "Canon PIXMA Drivers", url: "https://www.usa.canon.com/support/software-drivers", category: "Driver" },
  { id: "res-hpprint", name: "HP Printer Support", url: "https://support.hp.com/drivers/printers", category: "Driver" },
  { id: "res-ilovepdf", name: "iLovePDF", url: "https://www.ilovepdf.com/", category: "PDF" },
  { id: "res-smallpdf", name: "Smallpdf", url: "https://smallpdf.com/", category: "PDF" },
  { id: "res-tinypng", name: "TinyPNG", url: "https://tinypng.com/", category: "Image" },
  { id: "res-removebg", name: "Remove.bg", url: "https://www.remove.bg/", category: "Image" },
  { id: "res-lightshot", name: "Lightshot Screenshot", url: "https://app.prntscr.com/", category: "Utility" },
  { id: "res-qrconvert", name: "QR Code Generator", url: "https://www.qr-code-generator.com/", category: "Utility" },
];

const DEFAULT_FAVORITES: Favorite[] = [
  { id: "/print", kind: "tool", label: "Quick Print", icon: "print", target: "/print" },
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
};

const DEFAULT_DATA: AppData = {
  settings: DEFAULT_SETTINGS,
  services: DEFAULT_SERVICES,
  favorites: DEFAULT_FAVORITES,
  recents: [],
  resources: DEFAULT_RESOURCES,
};

function read(): AppData {
  if (typeof window === "undefined") return structuredClone(DEFAULT_DATA);
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return structuredClone(DEFAULT_DATA);
    const parsed = JSON.parse(raw) as Partial<AppData>;
    // Merge defaults to be forwards-compatible
    return {
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}),
        print: { ...DEFAULT_SETTINGS.print, ...(parsed.settings?.print ?? {}) },
        quickMoney: parsed.settings?.quickMoney ?? DEFAULT_SETTINGS.quickMoney,
      },
      services: parsed.services && parsed.services.length ? parsed.services : DEFAULT_SERVICES,
      favorites: parsed.favorites ?? DEFAULT_FAVORITES,
      recents: parsed.recents ?? [],
      resources: parsed.resources ?? DEFAULT_RESOURCES,
    };
  } catch {
    return structuredClone(DEFAULT_DATA);
  }
}

function write(data: AppData) {
  try {
    localStorage.setItem(KEY, JSON.stringify(data));
    window.dispatchEvent(new CustomEvent("rekaluna:storage", { detail: data }));
  } catch (e) {
    console.warn("Rekaluna storage unavailable", e);
  }
}

let memoryCache: AppData | null = null;

export const storage = {
  getAll(): AppData {
    if (!memoryCache) memoryCache = read();
    return memoryCache;
  },
  setAll(next: AppData) {
    memoryCache = next;
    write(next);
  },
  update(fn: (data: AppData) => AppData) {
    const next = fn(this.getAll());
    this.setAll(next);
    return next;
  },
  reset() {
    memoryCache = structuredClone(DEFAULT_DATA);
    write(memoryCache);
    return memoryCache;
  },
  export(): string {
    return JSON.stringify(this.getAll(), null, 2);
  },
  import(text: string): boolean {
    try {
      const parsed = JSON.parse(text) as AppData;
      if (typeof parsed !== "object") return false;
      this.setAll({
        settings: { ...DEFAULT_SETTINGS, ...parsed.settings,
          print: { ...DEFAULT_SETTINGS.print, ...(parsed.settings?.print ?? {}) } },
        services: Array.isArray(parsed.services) ? parsed.services : DEFAULT_SERVICES,
        favorites: Array.isArray(parsed.favorites) ? parsed.favorites : DEFAULT_FAVORITES,
        recents: Array.isArray(parsed.recents) ? parsed.recents : [],
        resources: Array.isArray(parsed.resources) ? parsed.resources : DEFAULT_RESOURCES,
      });
      return true;
    } catch {
      return false;
    }
  },
  addRecent(item: Omit<RecentItem, "id" | "createdAt">) {
    const all = this.getAll();
    const entry: RecentItem = {
      ...item,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
    };
    // de-dupe same label within last 20
    const next = [entry, ...all.recents.filter((r) => r.label !== item.label)].slice(0, 20);
    this.setAll({ ...all, recents: next });
  },
};

// Utility: ID
export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

// Currency formatter (Indonesian Rupiah)
const rupiah = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

const numericID = new Intl.NumberFormat("id-ID", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

export const format = {
  rupiah(n: number): string {
    if (!Number.isFinite(n)) return rupiah.format(0);
    return rupiah.format(Math.round(n));
  },
  number(n: number): string {
    if (!Number.isFinite(n)) return "0";
    return numericID.format(Math.round(n));
  },
  // Parse formatted string to number (accepts '10.000' or 'Rp10.000')
  parse(input: string): number {
    if (input == null) return 0;
    const cleaned = String(input).replace(/[^0-9,-]/g, "").replace(/,/g, ".");
    const n = Number(cleaned);
    return Number.isFinite(n) ? n : 0;
  },
};
