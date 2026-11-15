import { useEffect, useRef, type FormEvent, type ReactNode } from 'react'

import { LlamaStanding, LlamaWalking } from '../../shared/sprites/Sprites'
import { ListenButton } from '../speech/ListenButton'
import { useDictation } from '../speech/useDictation'
import { useChat } from './chatContext'
import styles from './Chat.module.css'

/** Aviso fijo cuando no hay señal: el chat lo dice antes de que falle. */
export function ChatOfflineNotice() {
  const { meta } = useChat()

  if (meta.isOnline) {
    return null
  }

  return (
    <p className={styles.offline} role="status">
      <strong>Sin señal.</strong> La llamita necesita señal para contestar.
    </p>
  )
}

/** Preguntas listas para tocar, para no tener que escribir. */
export function ChatSuggestions() {
  const { state, actions, meta } = useChat()

  return (
    <section aria-labelledby="sugerencias-titulo">
      <h2 id="sugerencias-titulo" className={styles.sectionTitle}>
        Toque una pregunta
      </h2>
      <ul className={styles.suggestions}>
        {meta.suggestions.map((suggestion) => (
          <li key={suggestion}>
            <button
              type="button"
              className={styles.suggestion}
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

/** La conversación. Los mensajes nuevos se anuncian a lectores de pantalla. */
export function ChatMessages() {
  const { state } = useChat()
  const endRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    endRef.current?.scrollIntoView?.({ block: 'nearest' })
  }, [state.messages.length, state.isSending])

  if (state.messages.length === 0 && !state.isSending) {
    return null
  }

  return (
    <section aria-label="Conversación">
      <ol className={styles.messages} aria-live="polite">
        {state.messages.map((message) => {
          if (message.role === 'user') {
            return (
              <li key={message.id} className={styles.question}>
                <span className={styles.who}>Usted preguntó</span>
                <p>{message.text}</p>
              </li>
            )
          }

          if (message.role === 'notice') {
            return (
              <li key={message.id} className={styles.notice}>
                <span className={styles.who}>Aviso</span>
                <p>{message.text}</p>
              </li>
            )
          }

          return (
            <li key={message.id} className={styles.answer}>
              <div className={styles.answerHead}>
                <LlamaStanding size={2.6} />
                <span className={styles.who}>La llamita responde</span>
              </div>
              <p className={styles.answerText}>{message.text}</p>
              {message.confidenceNote ? (
                <p className={styles.confidence}>
                  <strong>Qué tan seguros estamos:</strong>{' '}
                  {message.confidenceNote}
                </p>
              ) : null}
              <ListenButton id={message.id} text={message.text} />
            </li>
          )
        })}
      </ol>
      {state.isSending ? (
        <p className={styles.thinking} role="status">
          <LlamaWalking size={2.6} />
          La llamita está buscando la respuesta…
        </p>
      ) : null}
      <div ref={endRef} />
    </section>
  )
}

/** Botón para dictar la pregunta. No aparece si el celular no puede. */
export function ChatDictateButton() {
  const { state, actions, meta } = useChat()
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
      {dictation.isListening ? 'Escuchando… toque para parar' : 'Hablar'}
    </button>
  )
}

/** Caja para escribir la pregunta y enviarla. */
export function ChatComposer({ children }: { children?: ReactNode }) {
  const { state, actions, meta } = useChat()

  function handleSubmit(event: FormEvent) {
    event.preventDefault()
    actions.send(state.draft)
  }

  return (
    <form className={styles.composer} onSubmit={handleSubmit}>
      <label className={styles.sectionTitle} htmlFor="pregunta">
        O escriba su pregunta
      </label>
      <textarea
        id="pregunta"
        className={styles.input}
        rows={2}
        maxLength={meta.maxLength}
        value={state.draft}
        onChange={(event) => actions.setDraft(event.target.value)}
        enterKeyHint="send"
      />
      <div className={styles.composerActions}>
        {children}
        <button
          type="submit"
          className={styles.send}
          disabled={state.isSending || state.draft.trim() === ''}
        >
          Preguntar
        </button>
      </div>
    </form>
  )
}
