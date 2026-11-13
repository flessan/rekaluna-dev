import { useRef } from "react";
import { useOverlayMotion } from "../lib/motion";
import { useDialogAccessibility } from "../lib/dialog-accessibility";
import { Icon } from "../lib/icons";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  size?: "sm" | "md" | "lg";
  footer?: React.ReactNode;
}

export function Modal({ open, onClose, title, children, size = "md", footer }: ModalProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useOverlayMotion(overlayRef, open);
  useDialogAccessibility(overlayRef, open, onClose);

  if (!open) return null;
  const w = size === "sm" ? "max-w-sm" : size === "lg" ? "max-w-2xl" : "max-w-lg";

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 backdrop flex items-end md:items-center justify-center no-print"
      onClick={onClose}
    >
      <div
        className={`card motion-panel w-full ${w} mx-0 md:mx-4 overflow-hidden shadow-pop sheet md:!rounded-2xl`}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
          <h2 className="text-base font-semibold">{title}</h2>
          <button
            className="btn btn-ghost !p-2"
            onClick={onClose}
            aria-label="Close"
          >
            <Icon name="xmark" />
          </button>
        </div>
        <div className="px-5 py-4 max-h-[70vh] overflow-auto">{children}</div>
        {footer && (
          <div className="px-5 py-3 border-t flex items-center justify-end gap-2" style={{ borderColor: "var(--line)" }}>
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ open, onClose, title, children }: SheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);
  useOverlayMotion(overlayRef, open);
  useDialogAccessibility(overlayRef, open, onClose);

  if (!open) return null;
  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-40 backdrop flex items-end no-print"
      onClick={onClose}
    >
      <div
        className="sheet motion-panel w-full max-h-[88vh] overflow-hidden flex flex-col"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
      >
        <div className="pt-2.5 pb-1 flex justify-center">
          <span className="w-10 h-1.5 rounded-full" style={{ background: "var(--line)" }} />
        </div>
        {title && (
          <div className="px-5 pt-2 pb-3 flex items-center justify-between">
            <h3 className="font-semibold">{title}</h3>
            <button className="btn btn-ghost !p-2" onClick={onClose} aria-label="Close">
              <Icon name="xmark" />
            </button>
          </div>
        )}
        <div className="px-4 pb-[max(1rem,env(safe-area-inset-bottom))] overflow-auto">{children}</div>
      </div>
    </div>
  );
}
