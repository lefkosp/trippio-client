import path from "path"
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['seal.svg', 'apple-touch-icon.png'],
      workbox: {
        // woff2 is not in the default glob. Without it the self-hosted faces
        // are only in the HTTP cache, so a cold offline start (or a first load
        // behind the GFW) renders in the fallback system font — which is the
        // whole thing self-hosting was meant to prevent.
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        // ...but not the 101 Noto Sans SC chunks: that's 4.3 MB of CJK glyphs,
        // and any one trip needs a handful. They're cached on first use below
        // instead, which in practice means they're all warm long before anyone
        // gets on a plane.
        globIgnores: ['**/fonts/noto-sc/**'],
        runtimeCaching: [
          {
            urlPattern: /\/fonts\/noto-sc\/.*\.woff2$/,
            handler: 'CacheFirst',
            options: {
              cacheName: 'trippio-cjk-fonts',
              expiration: { maxEntries: 101, maxAgeSeconds: 60 * 60 * 24 * 365 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: 'Trippio',
        short_name: 'Trippio',
        description: 'A trip, planned by the people going on it.',
        theme_color: '#141210',
        background_color: '#141210',
        display: 'standalone',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: 'icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
    }),
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
