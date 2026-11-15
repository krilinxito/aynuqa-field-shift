import { Link } from 'react-router-dom'

import { useLanguage, type Language } from '../i18n/languageContext'
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
