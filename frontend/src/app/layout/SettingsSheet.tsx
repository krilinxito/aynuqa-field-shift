import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

import {
  checkLocalModel,
  downloadLocalModel,
  useLocalModel,
} from '../../features/chat/offline/localModel'
import { setReminders, type ReminderResult } from '../../features/mascot/reminders'

import { useLanguage, type Language } from '../i18n/languageContext'
import { usePreferences, type Preferences } from '../preferences/preferencesContext'
import { InstallPwaButton } from '../pwa/InstallPwaButton'
import { useTextSize } from '../textsize/textSizeContext'
import styles from './SettingsSheet.module.css'

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: Language; label: string }> = [
  { code: 'es', label: 'Español' },
  { code: 'ay', label: 'Aymara' },
  { code: 'qu', label: 'Quechua' },
]

interface SettingsSheetProps {
  id: string
  onClose: () => void
}

/** Panel desplegable con todo lo que no hace falta ver siempre. */
export function SettingsSheet({ id, onClose }: SettingsSheetProps) {
  const { lang, setLang, t } = useLanguage()
  const { state, actions } = useTextSize()
  const isLarge = state.size === 'grande'
  const { preferences, setPreference } = usePreferences()
  const localModel = useLocalModel()
  const [reminder, setReminder] = useState<ReminderResult | null>(null)

  async function toggleReminders() {
    const result = await setReminders(!preferences.mascotNotify)
    setPreference('mascotNotify', result === 'on')
    setReminder(result)
  }

  useEffect(() => {
    void checkLocalModel()
  }, [])
  const switches: ReadonlyArray<{ key: keyof Preferences; label: string }> = [
    { key: 'advanced', label: t.advancedMode },
    { key: 'mascotTalkative', label: t.mascotTalkative },
    { key: 'mascotAutoSpeak', label: t.mascotAutoSpeak },
  ]

  return (
    <section
      id={id}
      className={`${styles.sheet} no-imprimir`}
      aria-label={t.settings}
    >
      <div className={styles.inner}>
        <div className={styles.group}>
          <p className={styles.label}>{t.languageLabel} · Aru · Simi</p>
          <div className={styles.choices} role="group" aria-label={t.languageLabel}>
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                className={styles.choice}
                aria-pressed={lang === option.code}
                onClick={() => setLang(option.code)}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className={styles.group}>
          <p className={styles.label}>{t.textSizeLabel}</p>
          <button
            type="button"
            className={styles.toggle}
            aria-pressed={isLarge}
            onClick={actions.toggle}
          >
            <span aria-hidden="true" className={styles.toggleIcon}>
              A+
            </span>
            {isLarge ? t.normalText : t.largeText}
          </button>
        </div>

        <div className={styles.group}>
          {switches.map((item) => (
            <button
              key={item.key}
              type="button"
              role="switch"
              aria-checked={preferences[item.key]}
              className={styles.switch}
              onClick={() => setPreference(item.key, !preferences[item.key])}
            >
              <span className={styles.switchTrack} aria-hidden="true">
                <span className={styles.switchThumb} />
              </span>
              <span>{item.label}</span>
            </button>
          ))}
          <button
            type="button"
            role="switch"
            aria-checked={preferences.mascotNotify}
            className={styles.switch}
            onClick={() => void toggleReminders()}
          >
            <span className={styles.switchTrack} aria-hidden="true">
              <span className={styles.switchThumb} />
            </span>
            <span>{t.mascotNotify}</span>
          </button>
          {reminder === 'unsupported' ? <p>{t.remindersUnsupported}</p> : null}
          {reminder === 'denied' ? <p>{t.remindersDenied}</p> : null}
          {reminder === 'on' ? <p>{t.remindersOn}</p> : null}
        </div>

        {localModel.status !== 'unsupported' ? (
          <div className={styles.group}>
            {localModel.status === 'ready' ? (
              <p className={styles.label}>{t.localAiReady}</p>
            ) : (
              <button
                type="button"
                className={styles.toggle}
                disabled={localModel.status === 'downloading'}
                onClick={() => void downloadLocalModel()}
              >
                {localModel.status === 'downloading'
                  ? t.localAiDownloading(Math.round(localModel.progress * 100))
                  : t.localAiDownload}
              </button>
            )}
            {localModel.status === 'error' ? <p>{t.localAiError}</p> : null}
          </div>
        ) : null}

        <div className={styles.group}>
          <InstallPwaButton />
        </div>

        <div className={styles.footer}>
          <Link className={styles.link} to="/comunidad" onClick={onClose}>
            {t.changeCommunity}
          </Link>
          <button type="button" className={styles.close} onClick={onClose}>
            {t.closeSettings}
          </button>
        </div>
      </div>
    </section>
  )
}
