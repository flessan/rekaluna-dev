/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#9C1C26",
          50: "#FBEBEC",
          100: "#F4CCD0",
          200: "#E69AA1",
          300: "#D66672",
          400: "#C23B4A",
          500: "#9C1C26",
          600: "#831720",
          700: "#661219",
          800: "#4A0D12",
          900: "#2E080B",
        },
        surface: "#FFFFFF",
        canvas: "#F6F7F8",
        ink: "#1A1A1B",
        muted: "#787C7E",
        line: "#D7DADC",
      },
      fontFamily: {
        sans: [
          "Inter",
          "ui-sans-serif",
          "system-ui",
          "-apple-system",
          "Segoe UI",
          "Roboto",
          "Helvetica Neue",
          "Arial",
          "sans-serif",
        ],
        mono: [
          "ui-monospace",
          "SFMono-Regular",
          "Menlo",
          "Monaco",
          "Consolas",
          "monospace",
        ],
      },
      boxShadow: {
        soft: "0 1px 2px rgba(26,26,27,0.04), 0 2px 8px rgba(26,26,27,0.04)",
        pop: "0 8px 24px rgba(26,26,27,0.10)",
        ring: "0 0 0 3px rgba(156,28,38,0.18)",
      },
      borderRadius: {
        xl: "12px",
        "2xl": "16px",
      },
      fontSize: {
        "2xs": ["0.6875rem", { lineHeight: "0.875rem" }],
      },
      transitionTimingFunction: {
        snappy: "cubic-bezier(0.2, 0.8, 0.2, 1)",
      },
    },
  },
  plugins: [],
};
