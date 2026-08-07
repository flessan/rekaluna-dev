import { useNavigate } from "react-router-dom";
import { BottomSheet } from "./Modal";
import { Icon } from "../lib/icons";

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
      <div className="pb-6 space-y-4">
        {/* Quick grid */}
        <div className="grid grid-cols-4 gap-2">
          <Tile
            icon="print"
            label="Print Studio"
            onClick={() => go("/print")}
          />
          <Tile
            icon="layers"
            label="Templates"
            onClick={() => go("/templates")}
          />
          <Tile
            icon="gear"
            label="Settings"
            onClick={() => {
              onOpenModal("settings");
              onClose();
            }}
          />
          <Tile
            icon="circle-info"
            label="About"
            onClick={() => go("/about")}
          />
        </div>

        {/* Navigation list */}
        <div>
          <div className="label mb-2 px-1">Navigate</div>
          <div className="card overflow-hidden">
            <Row icon="house" label="Workspace" onClick={() => go("/")} />
            <Row icon="print" label="Print Studio" onClick={() => go("/print")} />
            <Row
              icon="calculator"
              label="Price Desk"
              onClick={() => go("/price")}
            />
            <Row icon="tools" label="Toolbox" onClick={() => go("/tools")} />
            <Row
              icon="layers"
              label="Templates"
              onClick={() => go("/templates")}
              last
            />
          </div>
        </div>
      </div>
    </BottomSheet>
  );
}

function Tile({
  icon,
  label,
  onClick,
}: {
  icon: string;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 p-3 rounded-xl active:bg-[rgba(26,26,27,0.06)]"
    >
      <span
        className="w-12 h-12 rounded-xl flex items-center justify-center text-white"
        style={{ background: "var(--brand)" }}
      >
        <Icon name={icon} />
      </span>
      <span className="text-[11px] leading-tight text-center">{label}</span>
    </button>
  );
}

function Row({
  icon,
  label,
  onClick,
  last,
}: {
  icon: string;
  label: string;
  onClick: () => void;
  last?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-sm text-left active:bg-[rgba(26,26,27,0.04)] ${
        last ? "" : "border-b"
      }`}
      style={{ borderColor: "var(--line)" }}
    >
      <Icon name={icon} className="text-muted" />
      <span className="flex-1 font-medium">{label}</span>
      <Icon name="chevron-right" className="text-muted" size="sm" />
    </button>
  );
}
