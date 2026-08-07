// ── Rekaluna Type Definitions ──

export type ThemeMode = "light" | "dark" | "system";

export interface PrintPreferences {
  paper: "A4" | "F4" | "Letter" | "Legal";
  orientation: "portrait" | "landscape";
  copies: number;
  scaling: "fit" | "fill" | "original";
  margin: "none" | "small" | "normal" | "large";
}

export interface PrintService {
  id: string;
  name: string;
  price: number;
}

export interface TransactionItem {
  id: string;
  serviceId?: string;
  name: string;
  price: number;
  qty: number;
  note?: string;
  createdAt: number;
}

export interface Favorite {
  id: string;
  kind: "tool" | "resource" | "template";
  label: string;
  icon: string;
  target: string;
}

export interface RecentActivity {
  id: string;
  kind: "print" | "price" | "resource" | "calc";
  label: string;
  detail?: string;
  createdAt: number;
}

export interface ResourceLink {
  id: string;
  name: string;
  url: string;
  category: string;
  note?: string;
}

export interface Template {
  id: string;
  name: string;
  description: string;
  icon: string;
  paper: string;
  orientation: "portrait" | "landscape";
  layout: "grid" | "single" | "multi";
  rows?: number;
  cols?: number;
}

export interface PrintQueueItem {
  id: string;
  imageSrc: string;
  name: string;
  paper: string;
  orientation: string;
  copies: number;
  createdAt: number;
  note?: string;
}

export interface ClipboardItem {
  id: string;
  imageSrc: string;
  name: string;
  width: number;
  height: number;
  createdAt: number;
}

export interface AppSettings {
  theme: ThemeMode;
  print: PrintPreferences;
  quickMoney: number[];
  counterMode: boolean;
}

export interface AppData {
  settings: AppSettings;
  services: PrintService[];
  favorites: Favorite[];
  recents: RecentActivity[];
  resources: ResourceLink[];
  templates: Template[];
  printQueue: PrintQueueItem[];
  clipboard: ClipboardItem[];
}
