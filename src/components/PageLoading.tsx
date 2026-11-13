import { useI18n } from "../lib/i18n";

export default function PageLoading() {
  const { t } = useI18n();
  return (
    <div className="card max-w-6xl mx-auto p-5 space-y-4" role="status" aria-busy="true">
      <span className="sr-only">{t("pageLoading")}</span>
      <div className="h-5 w-48 rounded-md" style={{ background: "color-mix(in srgb, var(--line) 70%, transparent)" }} />
      <div className="h-3 w-72 max-w-full rounded-md" style={{ background: "color-mix(in srgb, var(--line) 50%, transparent)" }} />
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 pt-3">
        {[0, 1, 2, 3].map((item) => (
          <div key={item} className="h-28 rounded-xl border" style={{ borderColor: "var(--line)" }} />
        ))}
      </div>
    </div>
  );
}
