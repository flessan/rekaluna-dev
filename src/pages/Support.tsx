import { Icon } from "../lib/icons";
import { useToast } from "../lib/toast";
import { useI18n } from "../lib/i18n";

export default function SupportPage() {
  const toast = useToast();
  const { t } = useI18n();
  const donateLink = new URL("/donate", window.location.origin).toString();

  return (
    <div className="max-w-3xl mx-auto">
      <div className="card p-6 md:p-10 text-center">
        <div className="w-14 h-14 mx-auto rounded-2xl flex items-center justify-center text-white mb-4" style={{ background: "var(--brand)" }}>
          <Icon name="heart" size="lg" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">{t("supportTitle")}</h1>
        <p className="mt-3 text-sm md:text-base text-muted leading-relaxed max-w-xl mx-auto">
{t("supportIntro")}
        </p>
        <p className="mt-2 text-sm md:text-base text-muted leading-relaxed max-w-xl mx-auto">
{t("supportNoObligation")}<br />{t("thankYou")}
        </p>

        <div className="mt-6 inline-block rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "#fff" }}>
          <div className="w-56 h-56 mx-auto bg-white">
            <img
              src="/qris.svg"
              alt="QRIS donation code"
              width="342"
              height="345"
              className="block w-full h-full object-contain"
              loading="lazy"
            />
          </div>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs text-muted">
            <span className="chip">QRIS</span>
            <span>{t("scanQris")}</span>
          </div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-2">
          <button
            className="btn btn-secondary"
            onClick={() => {
              navigator.clipboard?.writeText(donateLink);
              toast.push(t("donationCopied"));
            }}
          >
            <Icon name="link" /> {t("copyDonation")}
          </button>
          <a className="btn btn-primary" href={donateLink} target="_blank" rel="noopener noreferrer">
            <Icon name="up-right-from-square" /> {t("openDonation")}
          </a>
        </div>

        <div className="mt-8 text-[12px] text-muted max-w-lg mx-auto leading-relaxed">
{t("contributionLine")}
        </div>
      </div>
    </div>
  );
}
