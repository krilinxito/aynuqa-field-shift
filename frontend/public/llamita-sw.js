/*
 * Avisos de la llamita con la app cerrada. Lo importa el service worker de
 * Workbox. Usa Periodic Background Sync (Chrome/Android con la app instalada):
 * una vez al día revisa cuándo fue la última visita y, si pasaron 3 días o
 * más, manda un aviso. No usa servidor de push.
 */
const LLAMITA_CACHE = 'aynuqa-mascota'
const LLAMITA_KEY = '/__llamita/visita'
const LLAMITA_DAYS = 3

async function llamitaDaysAway() {
  const cache = await caches.open(LLAMITA_CACHE)
  const response = await cache.match(LLAMITA_KEY)
  if (!response) return 0
  const { lastVisit, enabled } = await response.json()
  if (!enabled || !lastVisit) return 0
  const ms = Date.now() - Date.parse(`${lastVisit}T12:00:00-04:00`)
  return Math.floor(ms / 86400000)
}

self.addEventListener('periodicsync', (event) => {
  if (event.tag !== 'llamita-recordatorio') return
  event.waitUntil(
    llamitaDaysAway().then((days) => {
      if (days < LLAMITA_DAYS) return undefined
      return self.registration.showNotification('¡La llamita te extraña!', {
        body: `Hace ${days} días que no revisas tu aynuqa. Las nubes no esperan.`,
        icon: '/icons/icon-192.png',
        badge: '/icons/icon-192.png',
        tag: 'llamita-recordatorio',
        lang: 'es',
      })
    }),
  )
})

self.addEventListener('notificationclick', (event) => {
  if (event.notification.tag !== 'llamita-recordatorio') return
  event.notification.close()
  event.waitUntil(self.clients.openWindow('/'))
})
