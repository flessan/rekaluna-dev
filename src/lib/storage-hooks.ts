import { useCallback, useSyncExternalStore } from "react";
import { storage, type AppData } from "./storage";

function subscribe(cb: () => void) {
  const handler = () => cb();
  window.addEventListener("rekaluna:storage", handler);
  window.addEventListener("storage", handler);
  return () => {
    window.removeEventListener("rekaluna:storage", handler);
    window.removeEventListener("storage", handler);
  };
}

function getSnapshot(): AppData {
  return storage.getAll();
}

export function useStorage() {
  const data = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    data,
    set: useCallback((next: AppData) => storage.setAll(next), []),
    update: useCallback((fn: (d: AppData) => AppData) => storage.update(fn), []),
    reset: useCallback(() => storage.reset(), []),
  };
}
