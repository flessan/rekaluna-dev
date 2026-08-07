import { createContext, useCallback, useContext, useState } from "react";
import { Icon } from "./icons";

export type ToastKind = "success" | "info" | "error";

interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

const ToastCtx = createContext<{
  push: (msg: string, kind?: ToastKind) => void;
}>({ push: () => {} });

export function useToast() {
  return useContext(ToastCtx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((l) => [...l, { id, message, kind }]);
    setTimeout(() => setToasts((l) => l.filter((t) => t.id !== id)), 2400);
  }, []);

  const bg = (k: ToastKind) =>
    k === "success"
      ? "rgba(22,163,74,0.1)"
      : k === "error"
        ? "rgba(180,35,24,0.1)"
        : "rgba(156,28,38,0.1)";
  const fg = (k: ToastKind) =>
    k === "success" ? "#16a34a" : k === "error" ? "#b42318" : "var(--brand)";
  const icon = (k: ToastKind) =>
    k === "success" ? "circle-check" : k === "error" ? "circle-exclamation" : "circle-info";

  return (
    <ToastCtx.Provider value={{ push }}>
      {children}
      <div className="fixed z-[70] bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card shadow-pop px-3 py-2.5 flex items-center gap-2 text-sm fade-in pointer-events-auto"
            role="status"
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
              style={{ background: bg(t.kind), color: fg(t.kind) }}
            >
              <Icon name={icon(t.kind)} size="xs" />
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </ToastCtx.Provider>
  );
}
