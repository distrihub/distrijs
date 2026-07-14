const tailwindcssAnimate = require('tailwindcss-animate');

/** @type {import('tailwindcss').Config} */
module.exports = {
  // Scan the app AND @distri/angular's source — the library's components are
  // consumed from source (see tsconfig paths), so their utility classes must
  // be in the content globs or Tailwind purges them.
  content: [
    './src/**/*.{html,ts}',
    '../../packages/angular/src/**/*.ts',
  ],
  theme: {
    extend: {
      colors: {
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))',
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))',
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))',
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))',
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      keyframes: {
        // Flash a form field when the agent writes to it, so a burst of
        // fill_field calls reads as progressive motion instead of a snap.
        'distri-field-fill': {
          '0%': { backgroundColor: 'hsl(var(--primary) / 0.18)', borderColor: 'hsl(var(--primary))' },
          '100%': { backgroundColor: 'transparent', borderColor: 'hsl(var(--border))' },
        },
        'distri-fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'distri-field-fill': 'distri-field-fill 1.1s ease-out',
        'distri-fade-in': 'distri-fade-in 0.18s ease-out',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
