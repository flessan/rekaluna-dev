import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Icon } from "../lib/icons";
import { storage, format, type ThemeMode } from "../lib/storage";
import { useStorage } from "../lib/storage-hooks";
import { applyTheme } from "../lib/theme";
import { useToast } from "../lib/toast";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, update, reset } = useStorage();
  const toast = useToast();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);

  const setTheme = (theme: ThemeMode) => {
    update((d) => ({ ...d, settings: { ...d.settings, theme } }));
    applyTheme(theme);
  };

  const setPaper = (paper: typeof s.print.paper) =>
    update((d) => ({ ...d, settings: { ...d.settings, print: { ...d.settings.print, paper } } }));
  const setOrientation = (orientation: typeof s.print.orientation) =>
    update((d) => ({ ...d, settings: { ...d.settings, print: { ...d.settings.print, orientation } } }));
  const setCopies = (copies: number) =>
    update((d) => ({ ...d, settings: { ...d.settings, print: { ...d.settings.print, copies: Math.max(1, Math.min(99, copies)) } } }));

  const [moneyInput, setMoneyInput] = useState(s.quickMoney.map((n) => String(n)).join(", "));
  useEffect(() => {
    setMoneyInput(s.quickMoney.map((n) => String(n)).join(", "));
  }, [s.quickMoney, open]);

  const saveQuickMoney = () => {
    const nums = moneyInput
      .split(/[,\s]+/)
      .map((x) => Number(x.replace(/[^0-9]/g, "")))
      .filter((n) => Number.isFinite(n) && n > 0);
    if (nums.length === 0) {
      toast.push("Add at least one amount", "error");
      return;
    }
    update((d) => ({ ...d, settings: { ...d.settings, quickMoney: nums } }));
    toast.push("Quick money saved");
  };

  const doExport = () => {
    const blob = new Blob([storage.export()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekaluna-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push("Data exported");
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = storage.import(String(reader.result));
      toast.push(ok ? "Data imported" : "Could not read file", ok ? "success" : "error");
      if (ok) {
        applyTheme(storage.getAll().settings.theme);
      }
    };
    reader.readAsText(file);
  };

  const doClear = () => {
    if (!confirm("Clear all local data? This resets services, favorites, and settings.")) return;
    reset();
    applyTheme(storage.getAll().settings.theme);
    toast.push("Data cleared");
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="md">
      <div className="space-y-6">
        <Section title="Printing defaults">
          <Row label="Paper size">
            <Segmented
              options={["A4", "F4", "Letter", "Legal"]}
              value={s.print.paper}
              onChange={(v) => setPaper(v as any)}
            />
          </Row>
          <Row label="Orientation">
            <Segmented
              options={["portrait", "landscape"]}
              value={s.print.orientation}
              onChange={(v) => setOrientation(v as any)}
              capitalize
            />
          </Row>
          <Row label="Copies">
            <div className="flex items-center border rounded-lg overflow-hidden w-32" style={{ borderColor: "var(--line)" }}>
              <button className="w-9 h-9 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]" onClick={() => setCopies(s.print.copies - 1)}><Icon name="minus" size="xs" /></button>
              <input
                type="number"
                className="flex-1 text-center bg-transparent outline-none num font-semibold text-sm"
                value={s.print.copies}
                onChange={(e) => setCopies(Number(e.target.value) || 1)}
              />
              <button className="w-9 h-9 flex items-center justify-center hover:bg-[rgba(26,26,27,0.04)]" onClick={() => setCopies(s.print.copies + 1)}><Icon name="plus" size="xs" /></button>
            </div>
          </Row>
        </Section>

        <Section title="Price desk">
          <Row label="Quick money buttons">
            <div className="w-full">
              <input
                className="input num"
                value={moneyInput}
                onChange={(e) => setMoneyInput(e.target.value)}
                placeholder="250, 500, 1000"
              />
              <div className="text-[11px] text-muted mt-1">Comma-separated Rupiah amounts.</div>
              <button className="btn btn-secondary mt-2 !py-1.5 text-xs" onClick={saveQuickMoney}>
                <Icon name="save" /> Save amounts
              </button>
            </div>
          </Row>
          <Row label="Services">
            <div className="text-sm text-muted">
              Edit services directly on the Price Desk using the <b>Edit services</b> button.
            </div>
          </Row>
        </Section>

        <Section title="Interface">
          <Row label="Theme">
            <Segmented
              options={["light", "dark", "system"]}
              value={s.theme}
              onChange={(v) => setTheme(v as ThemeMode)}
              capitalize
              icons={["sun", "moon", "theme"]}
            />
          </Row>
        </Section>

        <Section title="Data">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={doExport}>
              <Icon name="download" /> Export data
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Icon name="folder" /> Import data
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) doImport(f);
                e.target.value = "";
              }}
            />
            <button className="btn btn-danger" onClick={doClear}>
              <Icon name="trash" /> Clear local data
            </button>
          </div>
          <div className="text-[11px] text-muted mt-2 leading-relaxed">
            Everything is stored on this device. Use export to back up or move between computers.
            Current quick money:{" "}
            {s.quickMoney.map((q) => format.rupiah(q)).join(", ")}
          </div>
        </Section>

        <Section title="Shortcuts">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <span className="kbd whitespace-nowrap">Ctrl K</span><span>Open command search</span>
            <span className="kbd whitespace-nowrap">Ctrl V</span><span>Paste image in Quick Print</span>
            <span className="kbd whitespace-nowrap">Ctrl P</span><span>Print (when image is loaded)</span>
            <span className="kbd whitespace-nowrap">ESC</span><span>Close modals / sheets</span>
          </div>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="label mb-2">{title}</h3>
      <div className="space-y-3">{children}</div>
    </section>
  );
}

function Row({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex md:items-center gap-3 md:gap-6 flex-col md:flex-row">
      <div className="w-40 shrink-0 text-sm font-medium">{label}</div>
      <div className="flex-1">{children}</div>
    </div>
  );
}

function Segmented<T extends string>({
  options,
  value,
  onChange,
  capitalize,
  icons,
}: {
  options: T[];
  value: T;
  onChange: (v: T) => void;
  capitalize?: boolean;
  icons?: string[];
}) {
  return (
    <div className="inline-flex rounded-lg border p-0.5 w-full md:w-auto" style={{ borderColor: "var(--line)" }}>
      {options.map((o, i) => (
        <button
          key={o}
          onClick={() => onChange(o)}
          className={`flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-medium capitalize transition-snappy inline-flex items-center justify-center gap-1.5 ${
            value === o ? "bg-[color:var(--brand)] text-white" : "hover:bg-[rgba(26,26,27,0.04)]"
          }`}
          style={{ textTransform: capitalize ? "capitalize" : undefined }}
        >
          {icons && <Icon name={icons[i]} size="sm" />}
          {o}
        </button>
      ))}
    </div>
  );
}
