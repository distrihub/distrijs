import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3001,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    rollupOptions: {
      external: ['events', 'http', 'path', 'fs', 'net', 'url', 'querystring', 'buffer', 'stream', 'util', 'async_hooks', 'crypto', 'zlib', 'string_decoder']
    }
  },
  define: {
    global: 'globalThis',
  },
  optimizeDeps: {
    exclude: ['@a2a-js/sdk']
  }
})