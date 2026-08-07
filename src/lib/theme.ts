import { storage } from "./storage";
import type { ThemeMode } from "../types";

export function applyTheme(mode: ThemeMode) {
  const root = document.documentElement;
  const resolved =
    mode === "system"
      ? window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light"
      : mode;
  root.classList.toggle("dark", resolved === "dark");
  root.style.colorScheme = resolved;
}

export function initTheme() {
  const settings = storage.getAll().settings;
  applyTheme(settings.theme);
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (storage.getAll().settings.theme === "system") applyTheme("system");
  };
  mq.addEventListener("change", onChange);
  return () => mq.removeEventListener("change", onChange);
}
