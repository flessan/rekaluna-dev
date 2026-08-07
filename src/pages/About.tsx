import { Icon } from "../lib/icons";

export default function AboutPage() {
  return (
    <div className="max-w-3xl mx-auto space-y-5">
      <div className="card p-6 md:p-8">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-xl" style={{ background: "var(--brand)" }}>
            <Icon name="print" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">About Rekaluna</h1>
            <p className="text-sm text-muted">Version {import.meta.env.VITE_APP_VERSION ?? "1.0.0"}</p>
          </div>
        </div>
      </div>

      <Section icon="sparkles" title="What is Rekaluna?">
        <p>
          Rekaluna is a browser workspace for print shop operators — the tool you leave open all day.
          It combines quick printing, a fast price calculator, and the resources you reach for every
          day into one calm, focused, offline-ready workspace.
        </p>
      </Section>

      <Section icon="circle-info" title="Why was it created?">
        <p>
          Print operators juggle image editors, calculators, PDF tools, driver pages, price lists and
          screenshot utilities across a dozen windows. The cost is seconds per job, and minutes per
          hour — all day, every day. Rekaluna shaves those seconds off by keeping the daily
          workflows in one place.
        </p>
      </Section>

      <Section icon="shield" title="Philosophy">
        <ul className="list-disc pl-5 space-y-1.5 text-[15px] leading-relaxed">
          <li><b>Free and open-source.</b> MIT licensed. Inspect it, fork it, improve it.</li>
          <li><b>Privacy friendly.</b> No accounts, no analytics, no tracking. Your data stays on your device.</li>
          <li><b>Local-first.</b> Works offline. No server required for core features.</li>
          <li><b>Designed for operators.</b> Every feature must answer: “does this save time?” If not, it is removed.</li>
        </ul>
      </Section>

      <Section icon="code" title="Technology">
        <p>
          Rekaluna is built with <b>React</b>, <b>TypeScript</b>, <b>Vite</b>, and <b>Tailwind CSS</b>.
          Font Awesome provides the iconography. Persistence is plain <code className="px-1.5 py-0.5 rounded text-xs border" style={{ borderColor: "var(--line)" }}>localStorage</code>;
          printing uses the browser's native print dialog — no external services. A service worker
          caches assets so the app keeps working offline.
        </p>
      </Section>

      <Section icon="heart" title="Contribute">
        <p>
          Found a bug? Have an idea? Contributions are welcome. Open an issue or pull request on
          {" "}
          <a className="text-[color:var(--brand)] underline underline-offset-2" href="https://github.com/flessan/rekaluna-dev" target="_blank" rel="noopener noreferrer">
            GitHub <Icon name="up-right-from-square" size="2xs" />
          </a>.
          Translators, designers, and print operators are all encouraged to help shape the tool.
        </p>
      </Section>

      <Section icon="file-pdf" title="License">
        <p>
          Rekaluna is released under the <b>MIT License</b>. You can use, copy, modify, merge, publish,
          distribute, sublicense, and/or sell copies of the software, provided the original copyright
          notice is included. See the LICENSE file for full text.
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
