import { createContext, useCallback, useContext, useState } from "react";
import { Icon } from "./icons";

type ToastKind = "success" | "info" | "error";
interface Toast {
  id: string;
  message: string;
  kind: ToastKind;
}

const Ctx = createContext<{ push: (msg: string, kind?: ToastKind) => void }>({
  push: () => {},
});

export function useToast() {
  return useContext(Ctx);
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, kind }]);
    setTimeout(() => setToasts((list) => list.filter((t) => t.id !== id)), 2400);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div className="fixed z-[60] bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="card shadow-pop px-3 py-2.5 flex items-center gap-2 text-sm fade-in pointer-events-auto"
            role="status"
          >
            <span
              className="w-6 h-6 rounded-full flex items-center justify-center"
              style={{
                background:
                  t.kind === "success"
                    ? "rgba(22,163,74,0.1)"
                    : t.kind === "error"
                    ? "rgba(180,35,24,0.1)"
                    : "rgba(156,28,38,0.1)",
                color:
                  t.kind === "success"
                    ? "#16a34a"
                    : t.kind === "error"
                    ? "#b42318"
                    : "#9C1C26",
              }}
            >
              <Icon name={t.kind === "success" ? "circle-check" : t.kind === "error" ? "circle-exclamation" : "circle-info"} size="xs" />
            </span>
            <span className="flex-1">{t.message}</span>
          </div>
        ))}
      </div>
    </Ctx.Provider>
  );
}
