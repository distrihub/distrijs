import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/replay/index.ts', 'src/globals.css', 'src/theme.css', 'src/styles.css'],
  format: ['esm', 'cjs'],
  // CSS entries have no types; declarations come from the TS entries only.
  dts: { entry: ['src/index.ts', 'src/replay/index.ts'] },
  sourcemap: false,
  clean: true,
  external: [
    'react',
    'react-dom',
    'react-syntax-highlighter',
    /^@tiptap\/.*/,
    /^@radix-ui\/.*/,
    /^lucide-react/,
  ],
  noExternal: [],
  injectStyle: false,
  minify: true,
  outDir: 'dist',
  target: 'es2020',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";'
    }
  }
})