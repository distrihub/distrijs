import tailwindcssAnimate from 'tailwindcss-animate'

/**
 * A colour that a host can override with a `--distri-*` design token (any CSS
 * colour) and that otherwise falls back to the shadcn HSL variable. Opacity
 * modifiers (`bg-muted/60`) keep working through `color-mix`.
 */
const token = (distriVar, shadcnVar) =>
  `color-mix(in srgb, var(${distriVar}, hsl(var(${shadcnVar}))) calc(<alpha-value> * 100%), transparent)`

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  // Tailwind's preflight is global (`*`, `html`, `body`, `button`, …) and
  // restyles the host app. globals.css re-applies the resets Distri needs,
  // scoped under the Distri root classes.
  corePlugins: {
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        border: token('--distri-border', '--border'),
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: token('--distri-bg', '--background'),
        foreground: token('--distri-fg', '--foreground'),
        primary: {
          DEFAULT: token('--distri-accent', '--primary'),
          foreground: token('--distri-accent-fg', '--primary-foreground'),
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: token('--distri-surface', '--muted'),
          foreground: token('--distri-muted', '--muted-foreground'),
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        lg: "var(--distri-radius, var(--radius))",
        md: "calc(var(--distri-radius, var(--radius)) - 2px)",
        sm: "calc(var(--distri-radius, var(--radius)) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
    },
  },
  plugins: [tailwindcssAnimate],
};