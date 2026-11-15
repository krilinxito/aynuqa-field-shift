import { useState } from 'react'
import { useRegisterSW } from 'virtual:pwa-register/react'

import { useLanguage } from '../i18n/languageContext'
import styles from './UpdatePrompt.module.css'

/** Cada cuánto se pregunta al servidor si hay una versión nueva. */
const CHECK_EVERY_MS = 30 * 60 * 1000

/**
 * Cachés de datos que pueden quedar viejos con una versión nueva de la app.
 * La copia de los archivos de la app la limpia Workbox (cleanupOutdatedCaches);
 * el SQLite, la foto satelital y la IA local se conservan para no gastar datos.
 */
const STALE_DATA_CACHES = ['aynuqa-datos']

/**
 * Aviso de versión nueva: aparece cuando hay una actualización descargada y
 * la activa al tocar "Actualizar" (borra datos viejos y recarga la página).
 */
export function UpdatePrompt() {
  const { t } = useLanguage()
  const [dismissed, setDismissed] = useState(false)
  const [updating, setUpdating] = useState(false)
  const {
    needRefresh: [needRefresh],
    updateServiceWorker,
  } = useRegisterSW({
    onRegisteredSW(_url, registration) {
      if (!registration) return
      const check = () => {
        if (navigator.onLine) void registration.update().catch(() => {})
      }
      window.setInterval(check, CHECK_EVERY_MS)
      document.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'visible') check()
      })
    },
  })

  if (!needRefresh || dismissed) {
    return null
  }

  async function update() {
    setUpdating(true)
    try {
      if ('caches' in window) {
        await Promise.all(STALE_DATA_CACHES.map((name) => caches.delete(name)))
      }
    } finally {
      // Activa el service worker nuevo y recarga la página.
      await updateServiceWorker(true)
    }
  }

  return (
    <div className={`${styles.banner} no-imprimir`} role="status" aria-live="polite">
      <p className={styles.text}>{t.updateAvailable}</p>
      <div className={styles.actions}>
        <button type="button" className={styles.primary} onClick={() => void update()} disabled={updating}>
          {updating ? t.updating : t.updateNow}
        </button>
        <button type="button" className={styles.secondary} onClick={() => setDismissed(true)} disabled={updating}>
          {t.updateLater}
        </button>
      </div>
    </div>
  )
}
