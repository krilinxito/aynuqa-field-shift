import { useLanguage } from '../../app/i18n/languageContext'
import { useSpeech } from './speechContext'
import styles from './ListenButton.module.css'

interface ListenButtonProps {
  /** Identifica este texto entre todos los que se pueden escuchar. */
  id: string
  text: string
  /** Texto del botón; por defecto "Escuchar" en el idioma elegido. */
  label?: string
}

/** Botón que lee un texto en voz alta en español claro / fonética andina. */
export function ListenButton({ id, text, label }: ListenButtonProps) {
  const { state, actions, meta } = useSpeech()
  const { t, tr } = useLanguage()

  if (!meta.canSpeak) {
    return null
  }

  const isSpeaking = state.speakingId === id
  const isLoading = state.loadingId === id
  const buttonLabel = label ?? t.listen
  const translatedText = tr(text)

  return (
    <button
      type="button"
      className={`${styles.button} no-imprimir`}
      aria-pressed={isSpeaking}
      aria-busy={isLoading}
      onClick={() =>
        isSpeaking ? actions.stop() : actions.speak(id, translatedText)
      }
    >
      <svg
        className={styles.icon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        {isSpeaking ? (
          <rect x="6" y="6" width="12" height="12" fill="currentColor" />
        ) : (
          <>
            <path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor" />
            <path
              d="M16 8.5a5 5 0 0 1 0 7M18.5 6a8.5 8.5 0 0 1 0 12"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </>
        )}
      </svg>
      {isLoading ? t.loadingAudio : isSpeaking ? t.stopListening : buttonLabel}
    </button>
  )
}
