import { Icon } from "../../lib/icons";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-xl flex items-center justify-center text-white text-xl"
            style={{ background: "var(--brand)" }}
          >
            <Icon name="print" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">About Rekaluna</h1>
            <p className="text-sm text-muted">Print Shop Workspace v1.0</p>
          </div>
        </div>
      </div>

      <Section icon="sparkles" title="What is Rekaluna?">
        <p>
          Rekaluna is the daily command center for print shop operators — a local-first
          browser workspace that combines printing, pricing, and productivity tools
          into one focused application. It replaces the dozen tabs and utilities operators
          juggle all day with a single, calm, offline-ready workspace.
        </p>
      </Section>

      <Section icon="circle-info" title="Why Rekaluna?">
        <p>
          Print operators constantly switch between image editors, calculators, PDF tools,
          driver downloads, price lists, and screenshot utilities. The cost is seconds per
          job, minutes per hour, and hours per week. Rekaluna shaves those seconds off by
          keeping the most-used workflows in one place.
        </p>
      </Section>

      <Section icon="shield" title="Our Philosophy">
        <ul className="list-disc pl-5 space-y-1.5 leading-relaxed">
          <li><b>Free and open-source.</b> MIT licensed. Inspect, fork, improve.</li>
          <li><b>Privacy-first.</b> No accounts, no analytics, no tracking. Your data stays on your device.</li>
          <li><b>Local-first.</b> Works offline. No server required for core features.</li>
          <li><b>Operator-designed.</b> Every feature must answer: "Does this save time?" If not, it's removed.</li>
        </ul>
      </Section>

      <Section icon="code" title="Technology">
        <p>
          Built with <b>React</b>, <b>TypeScript</b>, <b>Vite</b>, and <b>Tailwind CSS</b>.
          Font Awesome for icons. Data persists via <code className="kbd">localStorage</code>.
          Printing uses browser-native APIs. A service worker enables offline use.
          No external services, no backend, no telemetry.
        </p>
      </Section>

      <Section icon="heart" title="Contribute">
        <p>
          Found a bug? Have an idea? Contributions are welcome. Open an issue or pull
          request on{" "}
          <a
            className="text-[color:var(--brand)] underline underline-offset-2"
            href="https://github.com/flessan/rekaluna-dev"
            target="_blank"
            rel="noopener noreferrer"
          >
            GitHub <Icon name="up-right-from-square" size="2xs" />
          </a>.
          Translators, designers, and print operators — everyone can help shape Rekaluna.
        </p>
      </Section>

      <Section icon="file-pdf" title="License">
        <p>
          Rekaluna is released under the <b>MIT License</b>. Use, modify, and distribute
          freely. See the LICENSE file for full terms.
        </p>
        <p className="text-xs text-muted mt-2">
          © {new Date().getFullYear()} Rekaluna contributors.
        </p>
      </Section>
    </div>
  );
}

function Section({
  icon,
  title,
  children,
}: {
  icon: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="card p-6 md:p-8">
      <div className="flex items-center gap-3 mb-3">
        <span
          className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
          style={{ background: "var(--brand)" }}
        >
          <Icon name={icon} size="sm" />
        </span>
        <h2 className="text-lg font-semibold">{title}</h2>
      </div>
      <div className="text-sm leading-relaxed text-[color:var(--ink)]">
        {children}
      </div>
    </section>
  );
}
