import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// Para ver la app en el celular con un túnel (ngrok): la API se pide al
// mismo sitio que sirve la app y aquí se reenvía al backend local.
const backendProxy = {
  '/api': 'http://127.0.0.1:8000',
  '/health': 'http://127.0.0.1:8000',
}
const tunnelHosts = ['.ngrok-free.app', '.ngrok-free.dev', '.ngrok.app', '.ngrok.io']

export default defineConfig({
  server: { proxy: backendProxy, allowedHosts: tunnelHosts },
  preview: { proxy: backendProxy, allowedHosts: tunnelHosts },
  plugins: [
    react(),
    VitePWA({
      // La app se actualiza sola: no se le pide nada a la persona.
      registerType: 'autoUpdate',
      injectRegister: 'auto',
      includeAssets: ['icons/aynuqa-mark.svg'],
      manifest: {
        id: '/',
        name: 'Aynuqa Field Shift',
        short_name: 'Aynuqa',
        description:
          'Ayuda para decidir la rotación de los sectores de la comunidad, con datos de la NASA.',
        lang: 'es',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        orientation: 'portrait',
        theme_color: '#1F4E79',
        background_color: '#FBF3E4',
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
        // Sin señal se muestran los últimos datos guardados. El chat nunca
        // se guarda: necesita señal y lo dice.
        runtimeCaching: [
          {
            urlPattern: ({ url }) =>
              url.pathname === '/api/sectors' || url.pathname === '/health',
            handler: 'NetworkFirst',
            options: {
              cacheName: 'aynuqa-datos',
              networkTimeoutSeconds: 4,
              expiration: { maxEntries: 8 },
              cacheableResponse: { statuses: [200] },
            },
          },
        ],
      },
      devOptions: {
        enabled: false,
      },
    }),
  ],
})
