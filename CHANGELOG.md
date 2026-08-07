# Changelog

All notable changes to Rekaluna will be documented in this file.

## [1.0.0] - 2026-08-07

### 🎉 Initial Release

Complete rewrite and redesign of Rekaluna as a professional, production-ready print shop workspace.

### ✨ Features

#### Print Studio
- Paste images directly with `Ctrl+V`
- Drag and drop file support
- Image preview with paper size visualization
- Rotation (0°, 90°, 180°, 270°)
- Paper sizes: A4, F4, Letter, Legal
- Orientation: Portrait and Landscape
- Scaling: Fit, Fill, Original
- Margins: None, Small, Normal, Large
- Multiple copies with per-page preview
- Print Queue for batch processing
- Browser-native printing

#### Price Desk (Signature Feature)
- 6 default printing services (customizable)
- 9 quick amount buttons (250 to 100.000)
- Editable services with inline editing
- Cash calculator with exact change
- Counter Mode for busy hours
- Smart input for natural language entries
- Receipt preview and clipboard copy
- Indonesian Rupiah (IDR) formatting
- Transaction undo/duplicate/clear

#### Toolbox
- 14 pre-loaded resources across 5 categories
- Printer drivers: Epson, Canon, HP, Brother
- PDF tools: iLovePDF, Smallpdf, PDFescape
- Image tools: TinyPNG, Remove.bg, Photopea
- Screenshot tools: Lightshot, ShareX
- Utilities: QR Code Generator, Ninite
- Add/edit/delete custom resources
- Category filtering and search
- Favorites integration

#### Templates
- 5 pre-built print layouts
- Pas Foto (passport photos) in 4×6, 3×4, 2×3
- A4 Photo Sheet
- Label Sheet
- Extensible template system

#### Workspace
- Time-based greeting
- Quick action cards
- Favorites grid with pin/unpin
- Recent activity feed
- Print Queue summary
- Keyboard shortcut reference

#### Productivity
- Command Palette (`Ctrl+K`) with search
- Favorites system across tools and resources
- Recent activity tracking
- Keyboard shortcuts throughout
- Toast notifications
- Settings modal with theme toggle

#### Mobile Experience
- Dedicated bottom navigation: Workspace, Price, Tools, More
- FAB for Print Studio quick access
- More sheet with full navigation
- Touch-friendly tap targets
- Responsive layouts throughout

### 🏗 Architecture

- React 19 with TypeScript
- Vite build system with PWA support
- Tailwind CSS design system
- Font Awesome iconography
- React Router for navigation
- localStorage persistence layer (v2)
- Service worker for offline support
- Clean feature-based project structure
- Type-safe storage hooks (useSyncExternalStore)

### 🎨 Design System

- Deep Red (`#9C1C26`) primary accent
- Clean white surfaces on neutral canvas
- Inter typeface with tabular numerals
- Consistent spacing and typography scale
- Light and dark mode support
- CSS custom properties for theming
- Subtle animations and transitions

### 📄 Documentation

- Comprehensive README with feature overview
- CONTRIBUTING.md with guidelines
- CHANGELOG.md
- MIT License
- Inline code documentation

---

## Versioning

Rekaluna follows [Semantic Versioning](https://semver.org/).

- **MAJOR** version for breaking changes or major redesigns
- **MINOR** version for new features (backwards-compatible)
- **PATCH** version for bug fixes and small improvements
