import { defineConfig } from 'vite'
import { fileURLToPath, URL } from 'node:url'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['favicon.svg'],
      devOptions: { enabled: false },
      manifest: {
        name: 'Kyuubik',
        short_name: 'Kyuubik',
        start_url: '/',
        display: 'standalone',
        background_color: '#0b1814',
        theme_color: '#0b1814',
        description: 'Kyuubik — личное пространство: заметки, календарь и файлы.',
        icons: [
          { src: '/favicon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any maskable' },
        ],
      },
      workbox: {
        clientsClaim: true,
        skipWaiting: true,
        navigateFallbackDenylist: [/^\/api\//],
        runtimeCaching: [
          {
            urlPattern: /\.(?:png|jpg|jpeg|svg|gif|webp|woff2?)$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'assets-v1',
              expiration: { maxEntries: 200, maxAgeSeconds: 60 * 60 * 24 * 30 },
            },
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  server: {
    port: 5173,
    host: '127.0.0.1',
    proxy: {
      '/api': {
        // Используем IPv4, чтобы избежать нюансов с ::1
        target: 'http://127.0.0.1:5174',
        changeOrigin: true,
        secure: false,
        // Лог ошибок прокси — поможет диагностики "network"
        configure: (proxy) => {
          proxy.on('error', (err, req, _res) => {
            console.error('[proxy-error]', req.method, req.url, String(err))
          })
        },
      },
    },
  },
})
