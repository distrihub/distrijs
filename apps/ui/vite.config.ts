import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const prefix = env.VITE_PREFIX?.trim()?.replace(/^\/|\/$/g, '')
  const base = prefix ? `/${prefix}/` : '/'

  return {
    base,
    plugins: [react()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        // Disambiguate: point to packages/components, not samples/components
        '@distri/components': path.resolve(__dirname, '../../packages/components/src'),
      },
    },
    server: {
      port: 5172,
      strictPort: true,
      proxy: {
        '/api': {
          target: 'http://localhost:8081',
          changeOrigin: true,
        },
      },
    },
    build: {
      outDir: 'dist',
    },
  }
})
