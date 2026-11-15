import { useState } from 'react'

import { useOnline } from '../../shared/hooks/useOnline'
import { Chakana, Skyline } from '../../shared/sprites/Sprites'
import { useLocalSyncStatus } from '../../data/powersync/syncStatus'
import { useLanguage } from '../i18n/languageContext'
import { InstallPwaButton } from '../pwa/InstallPwaButton'
import { isDemoData } from '../status/demoData'
import styles from './AppHeader.module.css'
import { SettingsSheet } from './SettingsSheet'

/** Aviso corto: solo aparece cuando hay algo que la persona debe saber. */
function StatusLine() {
  const isOnline = useOnline()
  const isDemo = isDemoData()
  const { t, lang } = useLanguage()
  const sync = useLocalSyncStatus()
  const lastSync = sync.lastSyncedAt
    ? new Intl.DateTimeFormat(lang === 'en' ? 'en-US' : 'es-BO', {
        dateStyle: 'short',
        timeStyle: 'short',
        timeZone: 'America/La_Paz',
      }).format(sync.lastSyncedAt)
    : null

  if (isOnline && !isDemo && !sync.syncing && !sync.error) {
    return null
  }

  return (
    <p className={styles.status} role="status">
      {!isOnline ? <span>{t.offlineNotice}</span> : null}
      {!isOnline && lastSync ? <span>{t.lastSyncNotice(lastSync)}</span> : null}
      {isOnline && sync.syncing ? (
        <span>Actualizando datos guardados…</span>
      ) : null}
      {isOnline && sync.error ? (
        <span>No se pudo actualizar. Conservamos los últimos datos.</span>
      ) : null}
      {isDemo ? <span>{t.demoDataNotice}</span> : null}
    </p>
  )
}

/** Cabecera mínima: marca y un solo botón de ajustes, para que quepa en 320 px. */
export function AppHeader() {
  const { t } = useLanguage()
  const [settingsOpen, setSettingsOpen] = useState(false)

  return (
    <header className={styles.header}>
      <Skyline />
      <div className={styles.bar}>
        <p className={styles.brand}>
          <Chakana size={1.7} />
          <span>Aynuqa</span>
        </p>
        <div className={styles.actions}>
          <InstallPwaButton compact />
          <button
            type="button"
            className={`${styles.settingsButton} no-imprimir`}
            aria-expanded={settingsOpen}
            aria-controls="ajustes"
            onClick={() => setSettingsOpen((open) => !open)}
          >
            <svg
              className={styles.settingsIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M4 7h10M18 7h2M4 17h2M10 17h10"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeLinecap="round"
              />
              <circle
                cx="16"
                cy="7"
                r="2.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              />
              <circle
                cx="8"
                cy="17"
                r="2.4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
              />
            </svg>
            <span>{settingsOpen ? t.closeSettings : t.settings}</span>
          </button>
        </div>
      </div>
      {settingsOpen ? (
        <SettingsSheet id="ajustes" onClose={() => setSettingsOpen(false)} />
      ) : null}
      <StatusLine />
    </header>
  )
}
