/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: "#080D17",           // Deep charcoal/navy background
          card: "#101827",         // Muted dark card surface
          cardHover: "#172338",    // Interactive card hover
          border: "#26344A",       // Subdued border
          borderLight: "#3A4A60",  // Prominent border
          text: "#F1F5F9",         // High-contrast primary text
          muted: "#B0BDCE",        // Muted secondary text
          dim: "#8797AD",          // Secondary metadata
          accent: "#2563EB",       // Restrained blue accent
          accentHover: "#1D4ED8",
          trusted: "#10B981",      // Verified healthy green
          trustedMuted: "#064E3B",
          warning: "#F59E0B",      // Amber warning/monitoring
          warningMuted: "#78350F",
          danger: "#EF4444",       // Red high-severity incident
          dangerMuted: "#7F1D1D",
          neutral: "#64748B",      // Inactive/unknown/N/A
        }
      },
      fontFamily: {
        mono: ['"JetBrains Mono"', '"Fira Code"', 'Consolas', 'monospace'],
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      }
    },
  },
  plugins: [],
}
