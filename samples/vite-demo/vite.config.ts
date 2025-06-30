import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000
  },
  build: {
    rollupOptions: {
      external: [
        // Exclude server-side modules from the browser bundle
        'events',
        'http',
        'https',
        'path',
        'fs',
        'net',
        'url',
        'querystring',
        'buffer',
        'stream',
        'util',
        'zlib',
        'crypto',
        'async_hooks',
        'string_decoder'
      ]
    }
  },
  define: {
    // Prevent Node.js globals from being used
    global: 'globalThis',
  },
  optimizeDeps: {
    // Force Vite to include only the client parts
    include: ['@a2a-js/sdk/build/src/types.js'],

  }
})