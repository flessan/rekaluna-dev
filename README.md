<p align="center">
  <img alt="Rekaluna" width="72" src="./public/favicon.svg" />
</p>

<h1 align="center">Rekaluna</h1>

<p align="center">
  The everyday workspace for print professionals.<br/>
  One workspace. Every essential tool. Zero friction.
</p>

<p align="center">
  <a href="https://github.com/flessan/rekaluna-dev/blob/main/LICENSE"><img alt="License" src="https://img.shields.io/badge/license-MIT-%239C1C26"/></a>
  <img alt="Status" src="https://img.shields.io/badge/status-beta-%239C1C26"/>
  <img alt="Offline" src="https://img.shields.io/badge/offline-ready-%2316a34a"/>
</p>

---

## What is Rekaluna?

Rekaluna is a lightweight, local-first browser workspace for print shop operators.
It replaces the dozen tabs and utilities that operators juggle all day with one
focused app: quick printing, a lightning-fast price desk, and a curated resource
center for drivers and PDF tools.

- Arrange multiple images on one sheet, drag them into place, snap-align, and print — no upload.
- Tap quick money buttons, tweak quantities, and answer "How much?" in seconds.
- Pin your favorite tools and resources. Everything is stored on your device.
- Works offline. Install it as a PWA. No account. No server. No tracking.

## Sections

- **Workspace** — greeting, quick actions, favorites, recent activity.
- **Quick Print** — multi-image sheet editor with drag-and-drop, snap guides, millimeter positioning, arrow-key nudging, duplicate objects, undo/redo, and square/rounded/circle/oval frames. Drop an image onto a frame to fill it. Includes 2-, 3-, 4-, and 6-frame layout presets, a paper background color palette with custom colors, and sheet-only printing that excludes the app interface.
- **Price Desk** — large money buttons, service chips, live totals, cash/change
  mode, undo/duplicate/clear, custom items.
- **Resource Center** — drivers, PDF tools, image tools, and utilities. Add your own.
- **Support** — optional donation via QRIS. No pressure.
- **About** — philosophy, tech stack, license, contribution info.
- **Languages** — English and Bahasa Indonesia, with a saved language preference.

## Keyboard workflow (desktop)

| Shortcut     | Action                      |
| ------------ | --------------------------- |
| `Ctrl + K`   | Open command palette        |
| `Ctrl + V`   | Paste image into Quick Print |
| `Ctrl + P`   | Print the current sheet |
| `Esc`        | Close modals / sheets       |
| `← ↑ → ↓`    | Move the selected object by 1 mm |
| `Alt + arrows` | Fine movement by 0.1 mm |
| `Shift + arrows` | Move by 10 mm |
| `Ctrl + D`   | Duplicate selected object   |
| `Ctrl + Z` / `Ctrl + Shift + Z` | Undo / redo canvas edits |
| `↑ ↓` `↵`    | Navigate lists / run command |

## Design

- Color: Deep Red `#9C1C26` on calm neutrals (`#F6F7F8` canvas, `#FFFFFF` surface).
- Typography: [Inter](https://rsms.me/inter/) with tabular numerals.
- Icons: Font Awesome solid + regular.
- Desktop: sidebar nav, top toolbar, dense workspace.
- Mobile: bottom nav, FAB, bottom sheets, rounded surfaces, touch-first targets.

## Development

Requires Node.js 20+.

```bash
npm install
npm run dev      # start dev server
npm run build    # production build -> dist/
npm run preview  # preview the production build
npm run lint     # oxlint
```

### Stack

- [Vite](https://vitejs.dev/) + [React](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
- [Tailwind CSS](https://tailwindcss.com/)
- [React Router](https://reactrouter.com/)
- [Font Awesome](https://fontawesome.com/)
- [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) for offline/PWA support
- Plain `localStorage` — no backend, no accounts, no telemetry

### Project layout

```
src/
  components/        AppShell, modals, sheets
  features/
    quickprint/      Quick Print page
    pricedesk/       Price Desk page
  lib/
    i18n.tsx         English / Indonesian locale provider
    storage.ts       Centralized localStorage layer
    storage-hooks.ts React bindings
    commands.tsx     Command palette + registry
    theme.ts         Light/dark/system
    icons.tsx        Font Awesome map
    toast.tsx        Subtle toast feedback
  pages/             Workspace, Resources, Support, About
  main.tsx           Routing + providers
  index.css          Design tokens, base styles, print styles
```

## Privacy

Rekaluna does not collect analytics, track users, or send any data anywhere.
Images you print never leave your browser. All preferences, services, favorites,
and history stay in your browser's `localStorage`. Use **Settings → Export data**
to back up or move between machines.

## Contributing

Issues, translations, ideas, and pull requests are welcome. This is built for
real print operators — feedback from shop floors shapes the roadmap.

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-idea`)
3. Commit your changes
4. Push and open a pull request

Before proposing a new feature, ask: *does this save a print operator time?*
If not, it probably doesn't belong.

## License

[MIT](./LICENSE) © Rekaluna contributors.
