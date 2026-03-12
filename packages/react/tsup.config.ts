import { defineConfig } from 'tsup'

export default defineConfig({
  entry: ['src/index.ts', 'src/globals.css'],
  format: ['esm', 'cjs'],
  dts: true,
  sourcemap: false,
  clean: true,
  external: ['react', 'react-dom', 'react-syntax-highlighter'],
  noExternal: ['codemirror', '@tiptap/react', '@tiptap/starter-kit', '@tiptap/extension-placeholder', '@tiptap/pm', '@tiptap/core'],
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