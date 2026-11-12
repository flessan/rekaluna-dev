import { Icon } from "../lib/icons";
import { useToast } from "../lib/toast";
import { useI18n } from "../lib/i18n";

// A simple placeholder QRIS SVG — a stylized QR grid since we can't load remote images.
// It's presented as the donation QR. Users can scan with any banking/e-wallet app.
function QRISArt() {
  // Deterministic-looking QR pattern using a seeded pseudo random grid for aesthetics.
  const size = 29;
  const cells: boolean[][] = [];
  let seed = 12345;
  const rnd = () => {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  };
  for (let y = 0; y < size; y++) {
    const row: boolean[] = [];
    for (let x = 0; x < size; x++) row.push(rnd() > 0.52);
    cells.push(row);
  }
  // Place finder patterns in corners
  const finder = (ox: number, oy: number) => {
    for (let y = 0; y < 7; y++) {
      for (let x = 0; x < 7; x++) {
        const edge = x === 0 || x === 6 || y === 0 || y === 6;
        const inner = x >= 2 && x <= 4 && y >= 2 && y <= 4;
        cells[oy + y][ox + x] = edge || inner;
      }
    }
    // clear padding ring
    for (let y = -1; y <= 7; y++) {
      for (let x = -1; x <= 7; x++) {
        if (x === -1 || x === 7 || y === -1 || y === 7) {
          const cx = ox + x, cy = oy + y;
          if (cy >= 0 && cy < size && cx >= 0 && cx < size) cells[cy][cx] = false;
        }
      }
    }
  };
  finder(0, 0);
  finder(size - 7, 0);
  finder(0, size - 7);

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" shapeRendering="crispEdges">
      <rect width={size} height={size} fill="#fff" />
      {cells.map((row, y) =>
        row.map((on, x) =>
          on ? <rect key={`${x},${y}`} x={x} y={y} width={1} height={1} fill="#1A1A1B" /> : null
        )
      )}
      {/* Center brand mark */}
      <rect x={size / 2 - 3} y={size / 2 - 3} width={6} height={6} rx={1} fill="#9C1C26" />
      <rect x={size / 2 - 2} y={size / 2 - 2} width={4} height={4} rx={1} fill="#fff" />
    </svg>
  );
}

export default function SupportPage() {
  const toast = useToast();
  const { t } = useI18n();
  const donateLink = "https://rekaluna.app/donate";

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
            <QRISArt />
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
