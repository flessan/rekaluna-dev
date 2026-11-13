import { createContext, useCallback, useContext, useEffect, useLayoutEffect, useRef, useState } from "react";
import { animate } from "animejs/animation";
import { createScope } from "animejs/scope";
import { spring } from "animejs/easings";
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
  const toastRootRef = useRef<HTMLDivElement>(null);
  const seenToastIds = useRef(new Set<string>());
  const timers = useRef(new Map<string, ReturnType<typeof setTimeout>>());

  useLayoutEffect(() => {
    const latest = [...toasts].reverse().find((toast) => !seenToastIds.current.has(toast.id));
    const activeIds = new Set(toasts.map((toast) => toast.id));
    seenToastIds.current = activeIds;
    const root = toastRootRef.current;
    const target = latest && root?.querySelector<HTMLElement>(`[data-toast-id="${latest.id}"]`);
    if (!root || !target) return;

    const scope = createScope({ root, mediaQueries: { reduceMotion: "(prefers-reduced-motion: reduce)" } }).add((self) => {
      if (!self || self.matches.reduceMotion) return;
      animate(target, {
        opacity: [0, 1],
        y: [8, 0],
        scale: [0.99, 1],
        duration: 220,
        ease: spring({ stiffness: 360, damping: 30 }),
      });
    });
    return () => scope.revert();
  }, [toasts]);

  useEffect(() => () => {
    timers.current.forEach((timer) => clearTimeout(timer));
    timers.current.clear();
  }, []);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = Math.random().toString(36).slice(2);
    setToasts((list) => [...list, { id, message, kind }]);
    const timer = setTimeout(() => {
      timers.current.delete(id);
      setToasts((list) => list.filter((t) => t.id !== id));
    }, 2400);
    timers.current.set(id, timer);
  }, []);

  return (
    <Ctx.Provider value={{ push }}>
      {children}
      <div ref={toastRootRef} className="fixed z-[60] bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 w-[min(92vw,380px)] pointer-events-none">
        {toasts.map((t) => (
          <div
            key={t.id}
            data-toast-id={t.id}
            className="card shadow-pop px-3 py-2.5 flex items-center gap-2 text-sm pointer-events-auto"
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
