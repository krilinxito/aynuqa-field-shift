/*
 * Avisos de la llamita con la app cerrada (ver public/llamita-sw.js).
 * Solo funcionan donde el navegador permite Periodic Background Sync
 * (Chrome en Android con la app instalada). En otros casos se dice claro.
 */
const CACHE = 'aynuqa-mascota'
const KEY = '/__llamita/visita'
const TAG = 'llamita-recordatorio'

interface PeriodicSyncManager {
  register: (tag: string, options: { minInterval: number }) => Promise<void>
  unregister: (tag: string) => Promise<void>
}

type RegistrationWithPeriodicSync = ServiceWorkerRegistration & {
  periodicSync?: PeriodicSyncManager
}

export type ReminderResult = 'on' | 'off' | 'denied' | 'unsupported'

async function registration(): Promise<RegistrationWithPeriodicSync | null> {
  if (!('serviceWorker' in navigator)) return null
  try {
    const ready: RegistrationWithPeriodicSync = await navigator.serviceWorker.ready
    return ready
  } catch {
    return null
  }
}

/** Guarda la última visita donde el service worker la puede leer. */
export async function saveVisitForReminders(lastVisit: string, enabled: boolean) {
  if (typeof caches === 'undefined') return
  try {
    const cache = await caches.open(CACHE)
    await cache.put(
      KEY,
      new Response(JSON.stringify({ lastVisit, enabled }), {
        headers: { 'Content-Type': 'application/json' },
      }),
    )
  } catch {
    // Sin caché: no hay avisos, la app sigue igual.
  }
}

export async function setReminders(enabled: boolean): Promise<ReminderResult> {
  const reg = await registration()
  if (!reg?.periodicSync || typeof Notification === 'undefined') {
    return enabled ? 'unsupported' : 'off'
  }
  if (!enabled) {
    await reg.periodicSync.unregister(TAG).catch(() => undefined)
    return 'off'
  }
  const permission = await Notification.requestPermission()
  if (permission !== 'granted') return 'denied'
  try {
    await reg.periodicSync.register(TAG, { minInterval: 24 * 60 * 60 * 1000 })
    return 'on'
  } catch {
    // Chrome solo lo permite con la app instalada.
    return 'unsupported'
  }
}
