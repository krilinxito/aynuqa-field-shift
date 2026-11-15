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

/**
 * Instala la app con un solo toque. Solo aparece cuando el navegador permite
 * instalar directo (Chrome o Edge); si no, no se muestra nada.
 */
export function InstallPwaButton({ compact = false }: { compact?: boolean }) {
  const { t } = useLanguage()
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(capturedPrompt)

  useEffect(() => {
    const sync = () => setDeferredPrompt(capturedPrompt)
    listeners.add(sync)
    sync()
    return () => {
      listeners.delete(sync)
    }
  }, [])

  if (!deferredPrompt) {
    return null
  }

  async function install() {
    const prompt = capturedPrompt
    if (!prompt) return
    // Chrome solo deja usar el aviso una vez.
    capturedPrompt = null
    setDeferredPrompt(null)
    await prompt.prompt()
    const choice = await prompt.userChoice
    if (choice.outcome === 'dismissed') {
      // Si dijo que no, el botón vuelve a quedar disponible.
      capturedPrompt = prompt
      listeners.forEach((notify) => notify())
    }
  }

  return (
    <button
      type="button"
      className={`${styles.installButton} ${compact ? styles.compact : ''} no-imprimir`}
      onClick={() => void install()}
    >
      <svg className={styles.icon} viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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
      <span>{compact ? t.installShort : t.downloadPhone}</span>
    </button>
  )
}
