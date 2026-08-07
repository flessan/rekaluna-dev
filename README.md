# Rekaluna — All Your Printing Needs.

**The browser tab that stays open all day in a print shop.**

Rekaluna is an open-source browser workspace built specifically for print shop operators. Lightweight, fast, practical — a collection of tools that help people behind the print counter get work done.

No login. No tracking. Data stays in your browser.

![License: MIT](https://img.shields.io/badge/License-MIT-%239C1C26) ![Vanilla JS](https://img.shields.io/badge/Vanilla-JS-yellow) ![Local-first](https://img.shields.io/badge/local--first-offline-green)

---

## Philosophy

- **Simple** — every feature immediately understandable
- **Fast** — minimize clicks, tap to add
- **Practical** — solves real print-shop problems only
- **Lightweight** — no frameworks, fast load
- **Local-first** — localStorage only, no backend
- **Open-source** — MIT, community-friendly

> Before adding any feature we ask: *"Does this save time for a print shop operator?"* If no, we don't build it.

## Features

### Quick Print
Paste image with `Ctrl+V`, drag & drop, preview, rotate, paper sizes (A4 / F4 / Letter / Legal), portrait/landscape, margin, Fit/Fill, grayscale/mirror, `window.print()` — no server upload.

### Price Desk
Cashier-fast calculator. Quick-money buttons (250–100.000), editable service presets, quantity controls, auto `Intl.NumberFormat('id-ID')` formatting, undo/clear, localStorage persistence, recent calculations, paid/change helper.

### Resources
Curated drivers (Epson, Canon, Brother, HP) and apps (Lightshot, Acrobat Reader, SumatraPDF, 7-Zip, Everything, Notepad++) — only official links, no file hosting.

### Workspace
Dashboard with greeting, live clock, quick actions, favorites, recents, keyboard shortcuts.

### Global
- Command palette `Ctrl+K`
- Mobile bottom nav + search sheet (Material You style)
- Keyboard: `Ctrl+V` paste, `Ctrl+P` print, `Esc` close
- Settings: default paper, theme (light/dark), preferences
- Support & About pages

## Design

- Colors: `#9C1C26` primary, `#F6F7F8` bg, `#FFFFFF` surface
- Typography: Inter
- Icons: Font Awesome 6 only
- Desktop: left sidebar (Reddit/GitHub/Linear inspired), Mobile: bottom nav + FAB

## Tech Stack

- HTML5, CSS3, Vanilla JavaScript ES6+
- No React/Vue/Angular/Svelte/Tailwind/Bootstrap

```
rekaluna/
  index.html
  css/
    style.css
    components.css
    responsive.css
  js/
    app.js
    calculator.js
    print.js
    storage.js
    ui.js
  assets/
  README.md
  LICENSE
```

## Getting Started

Just open `index.html` — no build step.

```bash
# serve locally (optional)
npx serve .
# or
python -m http.server 8000
```

## Contributing

Found a broken driver link or wrong preset? Open an issue or PR.

- Keep changes focused and practical
- Vanilla JS only, no new dependencies without discussion
- Ensure keyboard and screen-reader accessibility

## License

MIT — free for personal and commercial use. See `LICENSE`.

---

Made for print shop operators. ❤️
