import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/replay/index.ts', 'src/globals.css'],
  format: ['esm', 'cjs'],
  dts: true,
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