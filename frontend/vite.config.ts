import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'prompt',
      injectRegister: 'auto',
      includeAssets: ['icons/aynuqa-mark.svg', 'icons/aynuqa-maskable.svg'],
      manifest: {
        id: '/',
        name: 'Aynuqa Field Shift',
        short_name: 'Aynuqa',
        description: 'Apoyo a decisiones agrícolas para la comunidad de Pumani.',
        lang: 'es',
        start_url: '/territorio',
        scope: '/',
        display: 'standalone',
        theme_color: '#F8F4F2',
        background_color: '#F8F4F2',
        icons: [
          {
            src: '/icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any',
          },
          {
            src: '/icons/maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        cleanupOutdatedCaches: true,
        navigateFallback: '/index.html',
        globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
        runtimeCaching: [],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
