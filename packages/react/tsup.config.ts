import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/globals.css'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  external: ['react', 'react-dom'],
  noExternal: ['codemirror', 'react-syntax-highlighter'],
  injectStyle: false,
  minify: false,
  outDir: 'dist',
  target: 'es2020',
  esbuildOptions(options) {
    options.banner = {
      js: '"use client";'
    }
  }
})