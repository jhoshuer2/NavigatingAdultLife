import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { fileURLToPath } from 'node:url'

const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

const BUILD = (process.env.VERCEL_GIT_COMMIT_SHA ?? 'dev').slice(0, 7)

export default defineConfig({
  define: { __BUILD__: JSON.stringify(BUILD) },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png'],
      manifest: {
        name: 'Navigating Adult Life', short_name: 'Adult Life', description: 'Grow up Nigerian: a funny life simulator.',
        theme_color: '#14121f', background_color: '#14121f', display: 'standalone', orientation: 'portrait', id: '/', start_url: '/', scope: '/', categories: ['games', 'simulation'],
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,png,svg,woff2}'], runtimeCaching: [{ urlPattern: /\/voice\/.*\.(mp3|json)$/i, handler: 'CacheFirst', options: { cacheName: 'voice', expiration: { maxEntries: 140 }, cacheableResponse: { statuses: [200] } } }, { urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i, handler: 'StaleWhileRevalidate', options: { cacheName: 'fonts' } }] },
    }),
  ],
  resolve: {
    alias: {
      '@engine': r('./src/engine'),
      '@content': r('./src/content'),
      '@ui': r('./src/ui'),
      '@platform': r('./src/platform'),
      '@minigames': r('./src/minigames'),
      '@shared': r('./shared'),
    },
  },
  build: {
    target: 'es2020',
    rollupOptions: {
      output: {
        manualChunks: (id) => (id.includes('node_modules/three') ? 'three' : undefined),
      },
    },
  },
  test: { include: ['tests/**/*.test.ts'], environment: 'node' },
})
