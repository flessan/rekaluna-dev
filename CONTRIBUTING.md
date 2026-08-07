# Contributing to Rekaluna

Thank you for your interest in contributing! Rekaluna is an open-source workspace for print shop operators, and we welcome contributions of all kinds.

## Code of Conduct

Be kind, be constructive, and remember this tool is built for real people doing real work behind printing counters.

## How to Contribute

### Reporting Bugs

1. Check if the bug has already been reported in [Issues](https://github.com/flessan/rekaluna-dev/issues).
2. If not, open a new issue with:
   - A clear, descriptive title
   - Steps to reproduce the bug
   - Expected behavior vs. actual behavior
   - Browser and OS information
   - Screenshots if helpful

### Suggesting Features

Before suggesting a feature, ask: **"Does this save a print operator time?"**

1. Open an issue with the `enhancement` label
2. Describe the workflow problem it solves
3. Explain how it fits into Rekaluna's philosophy of speed and simplicity
4. Be open to discussion — we keep the product focused

### Pull Requests

1. Fork the repository
2. Create a branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Follow the existing code style:
   - TypeScript for all code
   - Tailwind CSS for styling
   - Functional components with hooks
   - Clear, descriptive variable names
   - Comments only where necessary
5. Run `npm run lint` and fix any issues
6. Run `npm run build` to ensure it compiles
7. Commit with a clear message
8. Push and open a pull request against `main`

### Development Setup

```bash
# Clone your fork
git clone https://github.com/YOUR_USERNAME/rekaluna-dev.git
cd rekaluna-dev

# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```

## Design Principles

When contributing, keep these principles in mind:

1. **Speed first.** Every interaction should feel instant. No loading spinners, no unnecessary confirmations.
2. **Local-first.** All data stays in `localStorage`. No server requirements.
3. **Privacy by default.** Never add analytics, tracking, or telemetry.
4. **Accessibility.** Use semantic HTML, keyboard navigation, and proper contrast.
5. **Mobile-friendly.** Features should work on both desktop and mobile with appropriate adaptations.

## What NOT to Add

- Authentication or user accounts
- Customer management or CRM features
- Inventory systems
- Payment processing
- Server-side databases
- Analytics or tracking
- Third-party ads
- Unnecessary complexity

Rekaluna is a **personal productivity tool**, not a business management system.

## Questions?

Open a [discussion](https://github.com/flessan/rekaluna-dev/discussions) or reach out through issues.

Thank you for helping make Rekaluna better!
