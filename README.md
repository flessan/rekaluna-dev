<p align="center">
  <img alt="Rekaluna" width="72" src="./public/favicon.svg" />
</p>

<h1 align="center">Rekaluna</h1>

<p align="center">
  <strong>The daily command center for print shop operators.</strong><br/>
  One workspace. Every essential tool. Zero friction.
</p>

<p align="center">
  <a href="https://github.com/flessan/rekaluna-dev/blob/main/LICENSE">
    <img alt="License" src="https://img.shields.io/badge/license-MIT-%239C1C26"/>
  </a>
  <img alt="Status" src="https://img.shields.io/badge/status-beta-%239C1C26"/>
  <img alt="Offline" src="https://img.shields.io/badge/offline-ready-%2316a34a"/>
  <img alt="PWA" src="https://img.shields.io/badge/PWA-ready-%239C1C26"/>
</p>

---

## What is Rekaluna?

Rekaluna is a **local-first browser workspace** purpose-built for print shop operators — the people behind the counter who print, copy, scan, and calculate all day. It replaces the dozen tabs and utilities operators juggle with **one focused, calm, offline-ready workspace**.

- **Print Studio** — paste (`Ctrl+V`), drop, or select an image. Preview on paper. Print.
- **Price Desk** — tap quick amount buttons, tweak quantities, and answer "How much?" in seconds. Built-in cash calculator, Counter Mode for rush hours, and smart input for fast entries.
- **Toolbox** — curated collection of printer drivers, PDF tools, image utilities, and screenshot tools. Add your own.
- **Templates** — reusable print layouts for passport photos, ID photos, A4 photo sheets, labels, and more.
- **Workspace** — daily command center with favorites, recent activity, quick actions, and print queue summary.

## Philosophy

Rekaluna is built on four principles:

1. **Speed.** Every feature must save time. No confirmations, no wizards, no loading spinners.
2. **Simplicity.** The interface stays out of the way. One glance tells you everything.
3. **Privacy.** No accounts, no analytics, no tracking, no servers. Everything stays on your device.
4. **Reliability.** Works offline. Install as a PWA. Always ready when you are.

If a feature doesn't make a print operator's day faster, easier, or more reliable — it doesn't belong in Rekaluna.

## Features

### Print Studio
- **Paste images directly** with `Ctrl+V` — no file dialogs
- **Drag and drop** files onto the workspace
- **Image preview** on your chosen paper size
- **Rotate images** in 90° increments
- **Paper sizes:** A4, F4, Letter, Legal
- **Orientation:** Portrait and landscape
- **Scaling:** Fit, fill, or original size
- **Margins:** None, small, normal, large
- **Multiple copies** with per-page preview
- **Add to Print Queue** for batch processing
- All processing happens **locally in your browser**

### Price Desk
- **6 default printing services** with customizable prices
- **9 quick amount buttons:** 250, 500, 1.000, 2.000, 5.000, 10.000, 20.000, 50.000, 100.000
- **Editable services** — add, remove, or change prices
- **Cash calculator** — enter amount received, see exact change
- **Counter Mode** — larger buttons, minimal distractions for busy hours
- **Smart input** — type "10 color print" or "5 x 5000 binding" and get instant calculations
- **Receipt preview** and clipboard copy
- **Indonesian Rupiah formatting** (Rp)
- All prices stored locally — customize once, use forever

### Toolbox
- **Pre-loaded resources:** Epson, Canon, HP, Brother printer drivers
- **PDF tools:** iLovePDF, Smallpdf, PDFescape
- **Image tools:** TinyPNG, Remove.bg, Photopea
- **Screenshot tools:** Lightshot, ShareX
- **Utilities:** QR Code Generator, Ninite
- **Add your own resources** with custom categories
- **Favorite** your most-used tools
- **Search and filter** by category
- All links to official sources — no software redistribution

### Templates
- **Pas Foto 4×6** — 4 pieces on 4R paper
- **Pas Foto 3×4** — 6 pieces on 4R paper
- **Pas Foto 2×3** — 8 pieces on 4R paper
- **A4 Photo Sheet** — multiple photos on one page
- **Label Sheet** — standard label layout
- Use any template with Print Studio's full settings

### Productivity Features
- **Command Palette** (`Ctrl+K`) — search and open anything instantly
- **Favorites** — pin tools and resources to your workspace
- **Recent Activity** — quick access to your last actions
- **Print Queue** — save unfinished print jobs
- **Keyboard Shortcuts** — designed for one-hand operation
- **Export/Import** — backup your settings and move between computers
- **Offline Support** — PWA with service worker caching

## Keyboard Shortcuts

| Shortcut    | Action                     |
|-------------|----------------------------|
| `Ctrl + K`  | Open command palette       |
| `Ctrl + V`  | Paste image into Print Studio |
| `Ctrl + P`  | Print (when image is loaded) |
| `Esc`       | Close modals and dialogs   |
| `↑ ↓ Enter` | Navigate and select        |

## Design

- **Primary accent:** Deep Red `#9C1C26`
- **Surfaces:** Clean white cards on neutral `#F6F7F8` canvas
- **Typography:** [Inter](https://rsms.me/inter/) with tabular numerals for prices
- **Icons:** [Font Awesome](https://fontawesome.com/) 6 — solid and regular
- **Desktop:** Sidebar navigation, sticky toolbar, dense workspace layout
- **Mobile:** Bottom navigation bar, FAB, bottom sheets, touch-friendly targets
- **Dark mode:** Automatic system preference or manual toggle

## Development

Requires **Node.js 20+**.

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Production build
npm run build

# Preview production build
npm run preview

# Lint
npm run lint
```

### Tech Stack

| Layer       | Technology                                            |
|-------------|-------------------------------------------------------|
| Framework   | [React 19](https://react.dev/)                        |
| Language    | [TypeScript](https://www.typescriptlang.org/)         |
| Build       | [Vite](https://vitejs.dev/)                           |
| Styling     | [Tailwind CSS](https://tailwindcss.com/)              |
| Routing     | [React Router](https://reactrouter.com/)              |
| Icons       | [Font Awesome](https://fontawesome.com/)              |
| PWA         | [vite-plugin-pwa](https://vite-pwa-org.netlify.app/)  |
| Storage     | `localStorage` — no backend, no accounts              |

### Project Structure

```
src/
├── app/              # (reserved for future needs)
├── components/       # Shared UI: AppShell, Modal, Settings, MobileSheets
├── features/
│   ├── workspace/    # Workspace dashboard and About page
│   ├── pricedesk/    # Price Desk — signature feature
│   ├── printstudio/  # Print Studio — image printing
│   ├── toolbox/      # Resource collection
│   └── templates/    # Print layout templates
├── hooks/            # React hooks (useStorage)
├── lib/              # Utilities: storage, icons, commands, toast, theme
├── types/            # TypeScript type definitions
├── index.css         # Design system and global styles
└── main.tsx          # App entry, routing, providers
```

## Privacy

Rekaluna **does not** collect analytics, track users, or send any data anywhere.

- Images you print **never leave your browser**
- All preferences, prices, favorites, and history stay in `localStorage`
- No accounts, no authentication, no servers
- Use **Settings → Export** to back up or move between machines
- Delete everything with **Settings → Clear All Data**

## Contributing

Rekaluna is built for real print operators — feedback from shop floors shapes the roadmap.

1. Fork the repository
2. Create a branch (`git checkout -b feature/your-idea`)
3. Make your changes
4. Commit and push
5. Open a pull request

Before proposing a new feature, ask: **"Does this save a print operator time?"** If not, it probably doesn't belong in Rekaluna.

## License

[MIT](./LICENSE) © Rekaluna contributors.

---

<p align="center">
  <sub>Built with ❤️ for the people who keep the world printing.</sub>
</p>
