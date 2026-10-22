/** @type {import('tailwindcss').Config} */

// One accent ("signal"), one cool neutral ("ice"), and two warm semantics.
// Tailwind's stock hue names are remapped onto these so every page inherits
// the palette without per-file edits.
const signal = {
  50: '#F6FCE9', 100: '#ECF8CF', 200: '#DCF2A6', 300: '#CDEE85', 400: '#C2EA6E',
  500: '#A6D24C', 600: '#83AD35', 700: '#628428', 800: '#475F21', 900: '#30411A', 950: '#18220C',
};
const ice = {
  50: '#F4F7FA', 100: '#E6ECF2', 200: '#D3DDE7', 300: '#BCCADA', 400: '#9DB0C4', 500: '#7D92A9',
  600: '#5E728A', 700: '#45556A', 800: '#2E3947', 900: '#1C232D', 950: '#11161C',
};
const coral = {
  50: '#FEF2F0', 100: '#FCDEDA', 200: '#F8C2BB', 300: '#F5A197', 400: '#F27A6E', 500: '#E65D51',
  600: '#C6463B', 700: '#99362F', 800: '#6B2724', 900: '#441A18', 950: '#2A100F',
};
const amber = {
  50: '#FDF8EB', 100: '#FAEDCC', 200: '#F5DEA6', 300: '#F0CD82', 400: '#EBB75F', 500: '#D99C3D',
  600: '#B37D2C', 700: '#875F23', 800: '#5C411B', 900: '#3A2A13', 950: '#22180B',
};
const ember = {
  50: '#FDF3EC', 100: '#FAE2D2', 200: '#F5C8AA', 300: '#F0AE84', 400: '#E8935D', 500: '#D77A42',
  600: '#B16133', 700: '#854A28', 800: '#5A331D', 900: '#392114', 950: '#21130B',
};

export default {
  // Hover styles only where a real pointer can hover (no sticky taps on touch)
  future: { hoverOnlyWhenSupported: true },
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        soc: {
          bg: "#07090D",           // obsidian base
          card: "#0D1117",         // panel core
          cardHover: "#141B23",
          border: "#1D2531",
          borderLight: "#2B3543",
          text: "#E9EEF3",
          muted: "#A6B2C0",
          dim: "#7B8898",
          accent: "#C2EA6E",       // signal
          accentHover: "#D3F18F",
          trusted: "#A6D24C",
          trustedMuted: "#30411A",
          warning: "#EBB75F",
          warningMuted: "#5C411B",
          danger: "#F27A6E",
          dangerMuted: "#6B2724",
          neutral: "#5E728A",
        },
        signal,
        ice,
        blue: signal,
        emerald: signal,
        green: signal,
        cyan: ice,
        purple: ice,
        indigo: ice,
        rose: coral,
        red: coral,
        amber,
        yellow: amber,
        orange: ember,
      },
      fontFamily: {
        sans: ['Instrument Sans', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'SFMono-Regular', 'monospace'],
        display: ['"Instrument Serif"', 'Georgia', 'serif'],
      },
      transitionTimingFunction: {
        DEFAULT: 'var(--ease-out)',
        out: 'var(--ease-out)',
        'in-out': 'var(--ease-in-out)',
        drawer: 'var(--ease-drawer)',
        spring: 'var(--spring)',
      },
      transitionProperty: {
        colors: 'color, background-color, border-color, text-decoration-color, fill, stroke, scale',
        DEFAULT: 'color, background-color, border-color, text-decoration-color, fill, stroke, opacity, box-shadow, transform, filter, backdrop-filter, scale',
      },
      zIndex: {
        nav: '40',
        overlay: '60',
        modal: '70',
        boot: '90',
      },
    },
  },
  plugins: [],
}
