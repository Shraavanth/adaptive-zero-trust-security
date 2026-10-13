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
          bg: "#0B0F17",           // Deep charcoal/navy background
          card: "#111827",         // Muted dark card surface
          cardHover: "#162032",    // Interactive card hover
          border: "#1E293B",       // Subdued border
          borderLight: "#334155",  // Prominent border
          text: "#F1F5F9",         // High-contrast primary text
          muted: "#94A3B8",        // Muted secondary text
          dim: "#64748B",          // Low-contrast metadata
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
