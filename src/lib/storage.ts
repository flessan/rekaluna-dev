// Centralized local storage layer for Rekaluna.
// All persistence goes through here so nothing is scattered across the app.

export type ThemeMode = "light" | "dark" | "system";

export interface PrintPrefs {
  paper: "A4" | "F4" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  scaling: "fit" | "fill" | "original";
  margin: "none" | "small" | "normal" | "large";
  background: string;
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
  { id: "res-epson-download-printer-driver", name: "Epson Download Printer Driver", url: "https://www.epson.co.id/Support/Printers/sh/s1", category: "Driver" },
  { id: "res-epson-l3210-linux", name: "Epson EcoTank L3210 Support", url: "https://www.epson.co.id/Printer-InkTank/L-Series/Epson-EcoTank-L3210/s/SPT_C11CJ68501", category: "Driver", note: "Official Linux printer and scanner downloads." },
  { id: "res-epson-linux-download-center", name: "Epson Linux Driver Download Center", url: "https://download.ebz.epson.net/dsc/search/01/search/?OSC=LX", category: "Driver", note: "Official ESC/P-R, ESC/P-R 2, and Linux utilities." },
  { id: "res-canon-download-printer-driver", name: "Canon Download Printer Driver", url: "https://id.canon/en/support/download", category: "Driver" },
  { id: "res-hp-download-printer-driver", name: "HP Download Printer Driver", url: "https://support.hp.com/drivers/printers", category: "Driver" },
  { id: "res-brother-linux-drivers", name: "Brother Linux Driver Downloads", url: "https://support.brother.com/g/b/downloadtop.aspx", category: "Driver", note: "Select your printer model and Linux distribution." },
  { id: "res-openprinting-printer-db", name: "OpenPrinting Printer Database", url: "https://openprinting.org/printers", category: "Driver", note: "Check Linux printer compatibility and available drivers." },
  { id: "res-gutenprint", name: "Gutenprint", url: "https://gimp-print.sourceforge.io/", category: "Driver", note: "Open-source printer drivers for many inkjet and photo printers." },
  { id: "res-cups-local", name: "CUPS Web Interface", url: "http://localhost:631", category: "Printing", note: "Manage printer queues, jobs, and printer administration on this device." },
  { id: "res-openprinting-cups", name: "CUPS Documentation", url: "https://openprinting.github.io/cups/", category: "Printing", note: "Documentation for the Common UNIX Printing System." },
  { id: "res-paper-sizes", name: "Paper Sizes Reference", url: "https://papersizes.io/", category: "Printing", note: "Check ISO, US, and other paper dimensions before printing." },
  { id: "res-ilovepdf", name: "iLovePDF", url: "https://www.ilovepdf.com/", category: "PDF" },
  { id: "res-smallpdf", name: "Smallpdf", url: "https://smallpdf.com/", category: "PDF" },
  { id: "res-pdfarranger", name: "PDF Arranger", url: "https://github.com/pdfarranger/pdfarranger", category: "PDF", note: "Desktop tool to merge, split, rotate, crop, and rearrange PDF pages." },
  { id: "res-pdfsam-basic", name: "PDFsam Basic", url: "https://pdfsam.org/pdfsam-basic/", category: "PDF", note: "Merge, split, extract, rotate, and reorder PDF pages." },
  { id: "res-qpdf", name: "qpdf", url: "https://qpdf.sourceforge.io/", category: "PDF", note: "Command-line PDF inspection and transformation utility." },
  { id: "res-ghostscript", name: "Ghostscript", url: "https://ghostscript.readthedocs.io/", category: "PDF", note: "PDF and PostScript processing tools for advanced print workflows." },
  { id: "res-lightshot", name: "Lightshot Screenshot", url: "https://app.prntscr.com/", category: "Utility" },
  { id: "res-qrconvert", name: "QR Code Generator", url: "https://www.qr-code-generator.com/", category: "Utility" },
];

const CURATED_PRINT_RESOURCE_IDS = new Set([
  "res-epson-l3210-linux",
  "res-epson-linux-download-center",
  "res-brother-linux-drivers",
  "res-openprinting-printer-db",
  "res-gutenprint",
  "res-cups-local",
  "res-openprinting-cups",
  "res-paper-sizes",
  "res-pdfarranger",
  "res-pdfsam-basic",
  "res-qpdf",
  "res-ghostscript",
]);

const DEFAULT_FAVORITES: Favorite[] = [
  { id: "/print", kind: "tool", label: "Quick Print", icon: "print", target: "/print" },
  { id: "/price", kind: "tool", label: "Price Desk", icon: "calculator", target: "/price" },
];

const DEFAULT_SETTINGS: AppSettings = {
  theme: "light",
  print: {
    paper: "A4",
    orientation: "portrait",
    scaling: "fit",
    margin: "normal",
    background: "#FFFFFF",
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
      settings: {
        ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}),
        print: { ...DEFAULT_SETTINGS.print, ...(parsed.settings?.print ?? {}) },
        quickMoney: parsed.settings?.quickMoney ?? DEFAULT_SETTINGS.quickMoney,
      },
      services: parsed.services && parsed.services.length ? parsed.services : DEFAULT_SERVICES,
      favorites: parsed.favorites ?? DEFAULT_FAVORITES,
      recents: parsed.recents ?? [],
      // Add newly curated resources without replacing the user's saved links.
      resources: parsed.resources?.length
        ? [
            ...parsed.resources,
            ...DEFAULT_RESOURCES.filter(
              (item) =>
                CURATED_PRINT_RESOURCE_IDS.has(item.id) &&
                !parsed.resources?.some((saved) => saved.id === item.id),
            ),
          ]
        : parsed.resources ?? DEFAULT_RESOURCES,
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
        settings: {
          ...DEFAULT_SETTINGS, ...parsed.settings,
          print: { ...DEFAULT_SETTINGS.print, ...(parsed.settings?.print ?? {}) }
        },
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
