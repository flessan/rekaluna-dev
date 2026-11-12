import { useEffect, useRef, useState } from "react";
import { Modal } from "./Modal";
import { Icon } from "../lib/icons";
import { storage, format, type ThemeMode } from "../lib/storage";
import { useStorage } from "../lib/storage-hooks";
import { applyTheme } from "../lib/theme";
import { useToast } from "../lib/toast";
import { useI18n } from "../lib/i18n";

export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, update, reset } = useStorage();
  const toast = useToast();
  const { t, locale, setLocale } = useI18n();
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
      toast.push(t("addAmountError"), "error");
      return;
    }
    update((d) => ({ ...d, settings: { ...d.settings, quickMoney: nums } }));
    toast.push(t("quickMoneySaved"));
  };

  const doExport = () => {
    const blob = new Blob([storage.export()], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `rekaluna-backup-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.push(t("dataExported"));
  };

  const doImport = (file: File) => {
    const reader = new FileReader();
    reader.onload = () => {
      const ok = storage.import(String(reader.result));
      toast.push(ok ? t("dataImported") : t("importFailed"), ok ? "success" : "error");
      if (ok) {
        applyTheme(storage.getAll().settings.theme);
      }
    };
    reader.readAsText(file);
  };

  const doClear = () => {
    if (!confirm(t("clearConfirm"))) return;
    reset();
    applyTheme(storage.getAll().settings.theme);
    toast.push(t("dataCleared"));
  };

  return (
    <Modal open={open} onClose={onClose} title={t("settings")} size="md">
      <div className="space-y-6">
        <Section title={t("printingDefaults")}>
          <Row label={t("paperSize")}>
            <Segmented
              options={["A4", "F4", "Letter", "Legal"]}
              value={s.print.paper}
              onChange={(v) => setPaper(v as any)}
            />
          </Row>
          <Row label={t("orientation")}>
            <Segmented
              options={["portrait", "landscape"]}
              value={s.print.orientation}
              onChange={(v) => setOrientation(v as any)}
              capitalize
            />
          </Row>
        </Section>

        <Section title={t("supportSection")}>
          <Row label={t("quickMoney")}>
            <div className="w-full">
              <input
                className="input num"
                value={moneyInput}
                onChange={(e) => setMoneyInput(e.target.value)}
                placeholder="250, 500, 1000"
              />
              <div className="text-[11px] text-muted mt-1">{t("commaSeparatedRupiah")}</div>
              <button className="btn btn-secondary mt-2 !py-1.5 text-xs" onClick={saveQuickMoney}>
                <Icon name="save" /> {t("saveAmounts")}
              </button>
            </div>
          </Row>
          <Row label={t("services")}>
            <div className="text-sm text-muted">
              {t("editServicesHint")}
            </div>
          </Row>
        </Section>

        <Section title={t("interface")}>
          <Row label={t("theme")}>
            <Segmented
              options={["light", "dark", "system"]}
              value={s.theme}
              onChange={(v) => setTheme(v as ThemeMode)}
              capitalize
              icons={["sun", "moon", "theme"]}
            />
          </Row>
        </Section>

        <Section title={t("language")}>
          <Row label={t("language")}>
            <div className="w-full">
              <div className="inline-flex rounded-lg border p-0.5 w-full md:w-auto" style={{ borderColor: "var(--line)" }}>
                <button onClick={() => setLocale("en")} className={"flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-snappy " + (locale === "en" ? "bg-[color:var(--brand)] text-white" : "hover:bg-[rgba(26,26,27,0.04)]")}>{t("english")}</button>
                <button onClick={() => setLocale("id")} className={"flex-1 md:flex-none px-3 py-1.5 rounded-md text-xs font-medium transition-snappy " + (locale === "id" ? "bg-[color:var(--brand)] text-white" : "hover:bg-[rgba(26,26,27,0.04)]")}>{t("indonesian")}</button>
              </div>
              <div className="text-[11px] text-muted mt-1">{t("languageHint")}</div>
            </div>
          </Row>
        </Section>

        <Section title={t("data")}>
          <div className="flex flex-wrap gap-2">
            <button className="btn btn-secondary" onClick={doExport}>
              <Icon name="download" /> {t("exportData")}
            </button>
            <button className="btn btn-secondary" onClick={() => fileRef.current?.click()}>
              <Icon name="folder" /> {t("importData")}
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
              <Icon name="trash" /> {t("clearData")}
            </button>
          </div>
          <div className="text-[11px] text-muted mt-2 leading-relaxed">
            {t("dataStored")}
            {t("currentQuickMoney")}{" "}
            {s.quickMoney.map((q) => format.rupiah(q)).join(", ")}
          </div>
        </Section>

        <Section title={t("shortcuts")}>
          <div className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
            <span className="kbd whitespace-nowrap">Ctrl K</span><span>{t("shortcutSearch")}</span>
            <span className="kbd whitespace-nowrap">Ctrl V</span><span>{t("shortcutPaste")}</span>
            <span className="kbd whitespace-nowrap">Ctrl P</span><span>{t("shortcutPrint")}</span>
            <span className="kbd whitespace-nowrap">ESC</span><span>{t("shortcutClose")}</span>
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
  const { t } = useI18n();
  const tOptionLabel = (option: T) => ["light", "dark", "system", "portrait", "landscape"].includes(option) ? t(option as any) : option;
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
          {tOptionLabel(o)}
        </button>
      ))}
    </div>
  );
}
