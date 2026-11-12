import { Icon } from "../lib/icons";
import { useI18n } from "../lib/i18n";

export default function AboutPage() {
  const { t } = useI18n();
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl" style={{ background: "var(--brand)" }}>
            <Icon name="print" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{t("aboutTitle")}</h1>
            <p className="text-sm text-muted">{t("version")} {import.meta.env.VITE_APP_VERSION ?? "1.0.0"}</p>
          </div>
        </div>
      </div>

      <Section icon="sparkles" title={t("whatIsRekaluna")}>
        <p>
{t("aboutIntro")}
        </p>
      </Section>

      <Section icon="circle-info" title={t("whyCreated")}>
        <p>
{t("whyCreatedBody")}
        </p>
      </Section>

      <Section icon="shield" title={t("philosophy")}>
        <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed">
          <li><b>{t("freeOpenSource")}</b> {t("mitBlurb")}</li>
          <li><b>{t("privacyFriendly")}</b> {t("privacyBlurb")}</li>
          <li><b>{t("localFirstTitle")}</b> {t("localFirstBlurb")}</li>
          <li><b>{t("operatorTitle")}</b> {t("operatorBlurb")}</li>
        </ul>
      </Section>

      <Section icon="code" title={t("technology")}>
        <p>
{t("technologyBody")}
        </p>
      </Section>

      <Section icon="heart" title={t("contribute")}>
        <p>
          {t("contributeBody")} {t("openIssuePrompt")}
          {" "}
          <a className="text-[color:var(--brand)] underline underline-offset-2" href="https://github.com/flessan/rekaluna-dev" target="_blank" rel="noopener noreferrer">
            GitHub <Icon name="up-right-from-square" size="2xs" />
          </a>.
        </p>
      </Section>

      <Section icon="file-pdf" title={t("license")}>
        <p>
{t("licenseBody")}
        </p>
        <p className="text-xs text-muted mt-2">
          © {new Date().getFullYear()} Rekaluna contributors.
        </p>
      </Section>
    </div>
  );
}

function Section({ icon, title, children }: { icon: string; title: string; children: React.ReactNode }) {
  return (
    <section className="card p-6 md:p-8">
      <div className="flex items-center gap-2 mb-3">
        <span className="w-8 h-8 rounded-lg flex items-center justify-center text-white" style={{ background: "var(--brand)" }}>
          <Icon name={icon} size="sm" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="text-[15px] leading-relaxed text-[color:var(--ink)] [&_code]:font-mono">
        {children}
      </div>
    </section>
  );
}
