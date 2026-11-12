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

- Arrange multiple images on one sheet, drag them into place, snap-align, and print - no upload.
- Tap quick money buttons, tweak quantities, and answer "How much?" in seconds.
- Pin your favorite tools and resources. Everything is stored on your device.
- Works offline. Install it as a PWA. No account. No server. No tracking.

## Sections

- **Workspace** - greeting, quick actions, favorites, recent activity.
- **Quick Print** - multi-image sheet editor with a tool rail, contextual selection toolbar, Page / Position / Layers inspector, drag-to-select group selection, eight-point resize handles, free rotation, zoom controls, snap guides, millimeter positioning, crop/pan controls, and square/rounded/circle/oval frames. Choose one shape for both quick layouts and newly added frames, so the editor has one shape selector. Circle layouts and edited circle frames stay truly circular. Drag an existing image onto a frame to fill it. Reorder layers by dragging them, or right-click objects for crop, fit/fill, replace, rotate, layer order, duplicate, copy/cut, and delete actions. The Landscape control gives the editor a landscape canvas. When printed, the complete layout is rotated onto a portrait sheet for consistent portrait output. Includes a custom paper background palette and isolated sheet-only printing.
- **Price Desk** - large money buttons, service chips, live totals, cash/change
  mode, undo/duplicate/clear, custom items.
- **Resource Center** - drivers, PDF tools, image tools, and utilities. Add your own.
- **Support** - optional donation via QRIS. No pressure.
- **Donate** - `/donate` displays the supplied QRIS SVG directly, without the app navigation or other page UI.
- **About** - philosophy, tech stack, license, contribution info.
- **Languages** - English and Bahasa Indonesia, with a saved language preference.

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
| `Ctrl + A`   | Select all canvas objects   |
| `Ctrl + C` / `Ctrl + X` / `Ctrl + V` | Copy / cut / paste objects |
| `Ctrl + D`   | Duplicate selected object(s) |
| `Ctrl + [` / `Ctrl + ]` | Send backward / bring forward |
| `Ctrl + 0`   | Fit canvas view |
| `Ctrl + +` / `Ctrl + -` | Zoom in / out |
| `Shift + click` / drag on empty page | Add / box-select multiple objects |
| `Right click` | Open the object context menu |
| `Ctrl + Z` / `Ctrl + Shift + Z` | Undo / redo canvas edits |
| `↑ ↓` `↵`    | Navigate lists / run command |

## Design

- Color: Deep Red `#9C1C26` on calm neutrals (`#F6F7F8` canvas, `#FFFFFF` surface).
- Typography: [Inter](https://rsms.me/inter/) with tabular numerals.
- Icons: Font Awesome solid + regular.
- Desktop: sidebar nav, top toolbar, dense workspace.
- Mobile: bottom nav, FAB, bottom sheets, rounded surfaces, touch-first targets.

## Browser and Linux support

- Rekaluna is a browser app and has no Arch-specific runtime package. It is intended for current desktop Firefox and Chromium-based browsers on Windows, macOS, and Linux, including Arch Linux.
- On Firefox under some Linux Wayland desktop setups, dragging files from the desktop into a browser tab can be affected by browser / desktop integration. Use **Add images** to open the native file picker, or paste an image with `Ctrl + V` as a fallback.
- For print accuracy, select the paper size that matches the printer, use 100% scale when exact millimeter dimensions matter, and enable background graphics when printing a custom paper color. Browser and printer preferences can override background-color output.

### Linux printer setup: Epson L3210

The Resources page includes a Linux printing installer for CUPS and the Epson ESC/P-R driver. It supports Arch-based systems (with `yay` or `paru`), Debian/Ubuntu, Fedora/RHEL, and openSUSE. On RPM-based distributions, the Epson driver package depends on the repositories enabled on that system; the script will say when the vendor driver needs to be installed manually.

Run the hosted installer:

```bash
curl -fsSL https://rekaluna.pages.dev/install/linux/epson-l3210.sh | bash
```

Or download it first, inspect it, then run it:

```bash
curl -fL https://rekaluna.pages.dev/install/linux/epson-l3210.sh -o install-epson-l3210.sh
less install-epson-l3210.sh
chmod +x install-epson-l3210.sh
./install-epson-l3210.sh
```

The script installs the printing stack and starts CUPS, but does not create a printer queue or alter existing queues. Open [CUPS](http://localhost:631), choose **Administration → Add Printer**, and select the connected printer. If an Epson L3210 profile is not listed, **Epson L3250 Series** can be tried as a fallback; availability depends on the installed driver build and printer connection. The installer does not install scanner software.


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
- Plain `localStorage` - no backend, no accounts, no telemetry

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
real print operators - feedback from shop floors shapes the roadmap.

1. Fork the repo
2. Create a branch (`git checkout -b feature/your-idea`)
3. Commit your changes
4. Push and open a pull request

Before proposing a new feature, ask: *does this save a print operator time?*
If not, it probably doesn't belong.

## License

[MIT](./LICENSE) © Rekaluna contributors.
