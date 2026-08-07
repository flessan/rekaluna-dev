import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Icon } from "../lib/icons";
import { storage } from "../lib/storage";
import { useStorage } from "../hooks/useStorage";
import { applyTheme } from "../lib/theme";
import { useToast } from "../lib/toast";
import type { ThemeMode } from "../types";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, update, reset } = useStorage();
  const toast = useToast();
  const s = data.settings;
  const fileRef = useRef<HTMLInputElement>(null);

  const setTheme = (theme: ThemeMode) => {
    update((d) => ({ ...d, settings: { ...d.settings, theme } }));
    applyTheme(theme);
  };

  const [moneyInput, setMoneyInput] = useState(s.quickMoney.join(", "));
  useEffect(() => {
    setMoneyInput(s.quickMoney.join(", "));
  }, [s.quickMoney, open]);

  const saveQuickMoney = () => {
    const nums = moneyInput
      .split(/[,\s]+/)
      .map((x: string) => Number(x.replace(/[^0-9]/g, "")))
      .filter((n: number) => Number.isFinite(n) && n > 0);
    if (nums.length === 0) {
      toast.push("Add at least one amount", "error");
      return;
    }
    update((d) => ({ ...d, settings: { ...d.settings, quickMoney: nums } }));
    toast.push("Quick money amounts saved");
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
      toast.push(ok ? "Data imported" : "Invalid file", ok ? "success" : "error");
      if (ok) applyTheme(storage.getAll().settings.theme);
    };
    reader.readAsText(file);
  };

  const doClear = () => {
    if (!confirm("Clear all local data? This resets everything to defaults.")) return;
    reset();
    applyTheme(storage.getAll().settings.theme);
    toast.push("All data cleared");
  };

  return (
    <Modal open={open} onClose={onClose} title="Settings" size="md">
      <div className="space-y-6">
        {/* Theme */}
        <Section title="Appearance">
          <div className="flex items-center gap-2">
            {(["light", "dark", "system"] as ThemeMode[]).map((t) => (
              <button
                key={t}
                onClick={() => setTheme(t)}
                className={`px-4 py-2 rounded-lg text-sm font-medium border capitalize transition-snappy ${
                  s.theme === t
                    ? "bg-[color:var(--brand)] text-white border-[color:var(--brand)]"
                    : "hover:bg-[rgba(26,26,27,0.04)]"
                }`}
                style={{ borderColor: s.theme === t ? "var(--brand)" : "var(--line)" }}
              >
                {t}
              </button>
            ))}
          </div>
        </Section>

        {/* Price Desk Settings */}
        <Section title="Price Desk">
          <div>
            <div className="text-sm font-medium mb-1">Quick Money Buttons</div>
            <input
              className="input num text-sm"
              value={moneyInput}
              onChange={(e) => setMoneyInput(e.target.value)}
              placeholder="250, 500, 1000"
            />
            <div className="text-[11px] text-muted mt-1">
              Comma-separated Rupiah amounts.
            </div>
            <button
              className="btn btn-primary mt-2 !py-1.5 text-sm"
              onClick={saveQuickMoney}
            >
              <Icon name="save" /> Save Amounts
            </button>
          </div>
        </Section>

        {/* Data */}
        <Section title="Data Management">
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={doExport}>
              <Icon name="download" /> Export
            </button>
            <button
              className="btn btn-secondary"
              onClick={() => fileRef.current?.click()}
            >
              <Icon name="folder" /> Import
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
              <Icon name="trash" /> Clear All Data
            </button>
          </div>
          <p className="text-[11px] text-muted mt-2 leading-relaxed">
            Everything stays on this device. Export a backup to move between computers.
          </p>
        </Section>

        {/* Keyboard shortcuts */}
        <Section title="Keyboard Shortcuts">
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <span className="kbd whitespace-nowrap">Ctrl K</span>
            <span>Open command search</span>
            <span className="kbd whitespace-nowrap">Ctrl V</span>
            <span>Paste image in Print Studio</span>
            <span className="kbd whitespace-nowrap">Ctrl P</span>
            <span>Print (when image loaded)</span>
            <span className="kbd whitespace-nowrap">ESC</span>
            <span>Close dialogs and panels</span>
          </div>
        </Section>

        {/* About */}
        <Section title="About Rekaluna">
          <p className="text-sm text-muted leading-relaxed">
            Open-source print shop workspace. MIT licensed. No accounts, no tracking, no servers.
            Built for real operators who need speed and simplicity.
          </p>
        </Section>
      </div>
    </Modal>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h3 className="label mb-3">{title}</h3>
      <div className="space-y-2">{children}</div>
    </section>
  );
}
