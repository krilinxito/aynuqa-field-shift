import {
  useEffect,
  useRef,
  useState,
  type FormEvent,
  type KeyboardEvent,
  type ReactNode,
} from 'react'

import { useLanguage } from '../../app/i18n/languageContext'
import { LlamaStanding, LlamaWalking } from '../../shared/sprites/Sprites'
import { ListenButton } from '../speech/ListenButton'
import { useDictation } from '../speech/useDictation'
import { useChat } from './chatContext'
import styles from './Chat.module.css'

/** Extrae solo "Confianza alta/media/baja" sin repetir notas técnicas largas. */
function shortConfidence(note: string | undefined): string | null {
  if (!note) {
    return null
  }
  const match = note.match(/Confianza\s+(alta|media|baja)/i)
  return match ? `Confianza ${match[1].toLowerCase()}` : null
}

/**
 * Muestra el texto de la respuesta palabra por palabra (efecto escritura fluida
 * como en las herramientas de IA modernas) para no soltar todo el bloque de golpe.
 */
function FluidAnswerText({
  text,
  animate,
}: {
  text: string
  animate: boolean
}) {
  const isTestEnv = import.meta.env.MODE === 'test'
  const words = text.split(/\s+/).filter(Boolean)
  const shouldStream = animate && !isTestEnv && words.length > 1
  const [visibleCount, setVisibleCount] = useState(
    shouldStream ? 1 : words.length,
  )

  useEffect(() => {
    if (!shouldStream) {
      return
    }

    const interval = window.setInterval(() => {
      setVisibleCount((current) => {
        if (current >= words.length) {
          window.clearInterval(interval)
          return words.length
        }
        return current + 2
      })
    }, 35)

    return () => window.clearInterval(interval)
  }, [shouldStream, words.length])

  const isTyping = shouldStream && visibleCount < words.length
  const shownText = isTyping ? words.slice(0, visibleCount).join(' ') : text

  return (
    <p className={styles.answerText}>
      {shownText}
      {isTyping ? (
        <span className={styles.cursor} aria-hidden="true">
          ▍
        </span>
      ) : null}
    </p>
  )
}

/** Aviso fijo cuando no hay señal: el chat lo dice antes de que falle. */
export function ChatOfflineNotice() {
  const { meta } = useChat()
  const { t } = useLanguage()

  if (meta.isOnline) {
    return null
  }

  return (
    <p className={styles.offline} role="status">
      {t.chatOffline}
    </p>
  )
}

/**
 * Preguntas listas para tocar.
 * Al inicio se ven grandes; cuando ya hay charla se vuelven fichas rápidas.
 */
export function ChatSuggestions() {
  const { state, actions, meta } = useChat()
  const { t } = useLanguage()
  const hasMessages = state.messages.length > 0
  const askedTexts = new Set(
    state.messages.filter((m) => m.role === 'user').map((m) => m.text),
  )
  const visibleSuggestions = meta.suggestions.filter((s) => !askedTexts.has(s))

  if (visibleSuggestions.length === 0) {
    return null
  }

  return (
    <section
      aria-labelledby="sugerencias-titulo"
      className={hasMessages ? styles.compactSuggestionsSection : undefined}
    >
      <h2 id="sugerencias-titulo" className={styles.sectionTitle}>
        {hasMessages ? t.otherQuickQuestions : t.tapQuestion}
      </h2>
      <ul
        className={
          hasMessages ? styles.suggestionsChips : styles.suggestions
        }
      >
        {visibleSuggestions.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              className={
                hasMessages ? styles.suggestionChip : styles.suggestion
              }
              disabled={state.isSending}
              onClick={() => actions.send(suggestion)}
            >
              {suggestion}
            </button>
          </li>
        ))}
      </ul>
    </section>
  )
}

/** La conversación estilo chat moderno con burbujas, autoscroll y estado "Respondiendo…". */
export function ChatMessages() {
  const { state, actions } = useChat()
  const { t, tr } = useLanguage()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ behavior: 'smooth', block: 'nearest' })
  }, [state.messages.length, state.isSending])

  if (state.messages.length === 0 && !state.isSending) {
    return null
  }

  const lastUserQuestion = [...state.messages]
    .reverse()
    .find((m) => m.role === 'user')?.text
  const lastAssistantId = [...state.messages]
    .reverse()
    .find((m) => m.role === 'assistant')?.id

  return (
    <section aria-label="Conversación" className={styles.thread}>
      <ol className={styles.messages} aria-live="polite">
        {state.messages.map((message) => {
          if (message.role === 'user') {
            return (
              <li key={message.id} className={styles.questionRow}>
                <div className={styles.question}>
                  <span className={styles.whoUser}>{t.youAsked}</span>
                  <p>{message.text}</p>
                </div>
              </li>
            )
          }

          if (message.role === 'notice') {
            return (
              <li key={message.id} className={styles.notice}>
                <span className={styles.who}>{t.noticeLabel}</span>
                <p>{message.text}</p>
                {lastUserQuestion && !state.isSending ? (
                  <button
                    type="button"
                    className={styles.retryButton}
                    onClick={() => actions.send(lastUserQuestion)}
                  >
                    {t.retry}
                  </button>
                ) : null}
              </li>
            )
          }

          const badge = shortConfidence(message.confidenceNote)

          return (
            <li key={message.id} className={styles.answerRow}>
              <div className={styles.answer}>
                <div className={styles.answerHead}>
                  <LlamaStanding size={2.4} />
                  <span className={styles.who}>{t.llamaAnswers}</span>
                  {badge ? (
                    <span className={styles.confidenceBadge}>{tr(badge)}</span>
                  ) : null}
                </div>
                <FluidAnswerText
                  key={message.text}
                  text={message.text}
                  animate={message.id === lastAssistantId}
                />
                <ListenButton id={message.id} text={message.text} />
              </div>
            </li>
          )
        })}
      </ol>
      {state.isSending ? (
        <div className={styles.thinkingBubble} role="status" aria-live="polite">
          <LlamaWalking size={2.6} />
          <div className={styles.thinkingContent}>
            <span className={styles.thinkingTitle}>{t.responding}</span>
            <span className={styles.dots} aria-hidden="true">
              <span />
              <span />
              <span />
            </span>
          </div>
        </div>
      ) : null}
      <div ref={endRef} />
    </section>
  )
}

/** Botón para dictar la pregunta. No aparece si el celular no puede. */
export function ChatDictateButton() {
  const { state, actions, meta } = useChat()
  const { t } = useLanguage()
  const dictation = useDictation(actions.setDraft)

  if (!dictation.isSupported || !meta.isOnline) {
    return null
  }

  return (
    <button
      type="button"
      className={styles.dictate}
      aria-pressed={dictation.isListening}
      disabled={state.isSending}
      onClick={() =>
        dictation.isListening ? dictation.stop() : dictation.start()
      }
    >
      <svg
        className={styles.dictateIcon}
        viewBox="0 0 24 24"
        aria-hidden="true"
        focusable="false"
      >
        <rect x="9" y="3" width="6" height="11" rx="3" fill="currentColor" />
        <path
          d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      {dictation.isListening ? t.listening : t.speak}
    </button>
  )
}

/** Barra inferior estilo chat de IA moderno: Enter envía y el botón responde al instante. */
export function ChatComposer({ children }: { children?: ReactNode }) {
  const { state, actions, meta } = useChat()
  const { t } = useLanguage()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    actions.send(state.draft)
  }

  function handleKeyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      actions.send(state.draft)
    }
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <label className={styles.sectionTitle} htmlFor="pregunta">
        {t.orWriteQuestion}
      </label>
      <div className={styles.composerBox}>
        <textarea
          id="pregunta"
          className={styles.input}
          rows={2}
          placeholder={t.writePlaceholder}
          maxLength={meta.maxLength}
          value={state.draft}
          onChange={(event) => actions.setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          enterKeyHint="send"
        />
        <div className={styles.composerActions}>
          {children}
          <button
            type="submit"
            className={styles.send}
            disabled={state.isSending || state.draft.trim() === ''}
          >
            <span>{state.isSending ? `${t.responding}…` : t.askButton}</span>
            <svg
              className={styles.sendIcon}
              viewBox="0 0 24 24"
              aria-hidden="true"
              focusable="false"
            >
              <path
                d="M4 12l16-8-6 16-2.5-6.5L4 12z"
                fill="currentColor"
              />
            </svg>
          </button>
        </div>
      </div>
    </form>
  )
}
