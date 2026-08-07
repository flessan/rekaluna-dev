import { useEffect, useMemo, useRef, useState } from "react";
import { BottomSheet } from "./Modal";
import { Icon } from "../lib/icons";
import { registry } from "../lib/commands";
import { useNavigate } from "react-router-dom";
import { useStorage } from "../lib/storage-hooks";
import { storage } from "../lib/storage";

export function MobileSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const nav = useNavigate();
  const { data } = useStorage();

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 100);
  }, [open]);

  const commands = useMemo(() => registry.search(q), [q, data]);

  return (
    <BottomSheet open={open} onClose={onClose}>
      <div className="flex items-center gap-2 border rounded-xl px-3 py-2 mb-3" style={{ borderColor: "var(--line)" }}>
        <Icon name="search" className="text-muted" />
        <input
          ref={inputRef}
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search tools, resources, settings…"
          className="flex-1 bg-transparent outline-none text-sm"
        />
      </div>
      <div className="pb-6 space-y-1">
        {commands.length === 0 && (
          <div className="text-center text-sm text-muted py-6">No matches.</div>
        )}
        {commands.map((c) => (
          <button
            key={c.id}
            onClick={() => {
              c.run({
                navigate: (p) => {
                  nav(p);
                  onClose();
                },
                openModal: () => {},
                openUrl: (u) => {
                  window.open(u, "_blank", "noopener,noreferrer");
                  storage.addRecent({ kind: "resource", label: c.label });
                },
              });
              onClose();
            }}
            className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-[rgba(26,26,27,0.04)] text-left"
          >
            <span className="w-9 h-9 rounded-lg flex items-center justify-center text-white" style={{ background: "var(--brand)" }}>
              <Icon name={c.icon} />
            </span>
            <span className="flex-1">
              <div className="text-sm font-medium">{c.label}</div>
              {c.hint && <div className="text-[11px] text-muted">{c.hint} · {c.group}</div>}
            </span>
            <Icon name="chevron-right" className="text-muted" />
          </button>
        ))}
      </div>
    </BottomSheet>
  );
}

export function MoreSheet({
  open,
  onClose,
  onOpenModal,
}: {
  open: boolean;
  onClose: () => void;
  onOpenModal: (id: string) => void;
}) {
  const nav = useNavigate();
  const go = (p: string) => {
    nav(p);
    onClose();
  };
  return (
    <BottomSheet open={open} onClose={onClose} title="More">
      <div className="pb-6">
        <div className="grid grid-cols-4 gap-2 mb-3">
          <ActionTile icon="gear" label="Settings" onClick={() => { onOpenModal("settings"); onClose(); }} />
          <ActionTile icon="keyboard" label="Shortcuts" onClick={() => { onOpenModal("shortcuts"); onClose(); }} />
          <ActionTile icon="heart" label="Support" onClick={() => go("/support")} />
          <ActionTile icon="circle-info" label="About" onClick={() => go("/about")} />
        </div>
        <div className="label mb-2 px-1">Navigate</div>
        <div className="card overflow-hidden">
          <RowItem icon="house" label="Workspace" onClick={() => go("/")} />
          <RowItem icon="print" label="Quick Print" onClick={() => go("/print")} />
          <RowItem icon="calculator" label="Price Desk" onClick={() => go("/price")} />
          <RowItem icon="folder" label="Resource Center" onClick={() => go("/resources")} last />
        </div>
      </div>
    </BottomSheet>
  );
}

function ActionTile({ icon, label, onClick }: { icon: string; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex flex-col items-center gap-1 p-3 rounded-xl hover:bg-[rgba(26,26,27,0.04)]">
      <span className="w-11 h-11 rounded-xl flex items-center justify-center text-white" style={{ background: "var(--brand)" }}>
        <Icon name={icon} />
      </span>
      <span className="text-[11px]">{label}</span>
    </button>
  );
}

function RowItem({ icon, label, onClick, last }: { icon: string; label: string; onClick: () => void; last?: boolean }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left hover:bg-[rgba(26,26,27,0.03)] ${last ? "" : "border-b"}`}
      style={{ borderColor: "var(--line)" }}
    >
      <Icon name={icon} className="text-muted" />
      <span className="flex-1 font-medium">{label}</span>
      <Icon name="chevron-right" className="text-muted" />
    </button>
  );
}
