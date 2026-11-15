import { useEffect, useState } from 'react'

import { useLanguage } from '../i18n/languageContext'
import styles from './InstallPwa.module.css'

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>
}

let capturedPrompt: BeforeInstallPromptEvent | null = null
const listeners = new Set<() => void>()

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    capturedPrompt = event as BeforeInstallPromptEvent
    listeners.forEach((notify) => notify())
  })

  window.addEventListener('appinstalled', () => {
    capturedPrompt = null
    listeners.forEach((notify) => notify())
  })
}

function isStandaloneMode(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  const standaloneMedia =
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(display-mode: standalone)').matches
  const iosStandalone =
    'standalone' in window.navigator &&
    (window.navigator as Navigator & { standalone?: boolean }).standalone ===
      true

  return standaloneMedia || iosStandalone
}

function isIosDevice(): boolean {
  if (typeof window === 'undefined') {
    return false
  }

  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

/**
 * Botón grande y simple para descargar/instalar la aplicación PWA en el celular.
 */
export function InstallPwaButton() {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(capturedPrompt)
  const [isInstalled, setIsInstalled] = useState<boolean>(isStandaloneMode)
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => {
    const sync = () => {
      setDeferredPrompt(capturedPrompt)
      setIsInstalled(isStandaloneMode())
    }

    listeners.add(sync)
    return () => {
      listeners.delete(sync)
    }
  }, [])

  if (isInstalled) {
    return null
  }

  async function handleInstallClick() {
    if (deferredPrompt) {
      await deferredPrompt.prompt()
      const choice = await deferredPrompt.userChoice
      if (choice.outcome === 'accepted') {
        capturedPrompt = null
        setDeferredPrompt(null)
        setIsInstalled(true)
      }
      return
    }

    setShowHelp((open) => !open)
  }

  const isIos = isIosDevice()

  return (
    <div className={`${styles.wrapper} no-imprimir`}>
      <button
        type="button"
        className={styles.installButton}
        aria-expanded={showHelp}
        onClick={() => void handleInstallClick()}
      >
        <svg
          className={styles.icon}
          viewBox="0 0 24 24"
          aria-hidden="true"
          focusable="false"
        >
          <rect
            x="6"
            y="2"
            width="12"
            height="20"
            rx="2.5"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
          />
          <path
            d="M12 7v7m0 0l-3-3m3 3l3-3M10 18h4"
            fill="none"
            stroke="currentColor"
            strokeWidth="2.2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        <span>{t.downloadPhone}</span>
      </button>

      {showHelp ? (
        <div
          className={styles.helpBox}
          role="region"
          aria-label="Cómo instalar en el celular"
        >
          <p className={styles.helpTitle}>{t.installHelpTitle}</p>
          {isIos ? (
            <ol className={styles.steps}>
              <li>{t.installIos1}</li>
              <li>{t.installIos2}</li>
            </ol>
          ) : (
            <ol className={styles.steps}>
              <li>{t.installAndroid1}</li>
              <li>{t.installAndroid2}</li>
            </ol>
          )}
          <button
            type="button"
            className={styles.closeHelp}
            onClick={() => setShowHelp(false)}
          >
            {t.understood}
          </button>
        </div>
      ) : null}
    </div>
  )
}
