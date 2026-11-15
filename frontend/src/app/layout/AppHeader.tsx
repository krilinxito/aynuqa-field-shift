import { useOnline } from '../../shared/hooks/useOnline'
import { Chakana, Skyline } from '../../shared/sprites/Sprites'
import { useLanguage, type Language } from '../i18n/languageContext'
import { InstallPwaButton } from '../pwa/InstallPwaButton'
import { isDemoData } from '../status/demoData'
import { useTextSize } from '../textsize/textSizeContext'
import styles from './AppHeader.module.css'

const LANGUAGE_OPTIONS: ReadonlyArray<{ code: Language; label: string }> = [
  { code: 'es', label: 'Español' },
  { code: 'ay', label: 'Aymara' },
  { code: 'qu', label: 'Quechua' },
]

/** Aviso corto: solo aparece cuando hay algo que la persona debe saber. */
function StatusLine() {
  const isOnline = useOnline()
  const isDemo = isDemoData()
  const { t } = useLanguage()

  if (isOnline && !isDemo) {
    return null
  }

  return (
    <p className={styles.status} role="status">
      {!isOnline ? <span>{t.offlineNotice}</span> : null}
      {isDemo ? <span>{t.demoDataNotice}</span> : null}
    </p>
  )
}

export function AppHeader() {
  const { state, actions } = useTextSize()
  const { lang, setLang, t } = useLanguage()
  const isLarge = state.size === 'grande'

  return (
    <header className={styles.header}>
      <Skyline />
      <div className={styles.bar}>
        <p className={styles.brand}>
          <Chakana size={1.7} />
          <span>Aynuqa</span>
        </p>
        <div className={`${styles.controls} no-imprimir`}>
          <div
            className={styles.langSwitch}
            role="group"
            aria-label="Idioma / Aru / Simi"
          >
            {LANGUAGE_OPTIONS.map((option) => (
              <button
                key={option.code}
                type="button"
                className={styles.langButton}
                aria-pressed={lang === option.code}
                onClick={() => setLang(option.code)}
              >
                {option.label}
              </button>
            ))}
          </div>
          <InstallPwaButton />
          <button
            type="button"
            className={styles.textSize}
            aria-pressed={isLarge}
            onClick={actions.toggle}
          >
            <span aria-hidden="true" className={styles.textSizeIcon}>
              A+
            </span>
            {isLarge ? t.normalText : t.largeText}
          </button>
        </div>
      </div>
      <StatusLine />
    </header>
  )
}
