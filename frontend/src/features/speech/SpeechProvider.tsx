import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { SpeechContext, type SpeechContextValue } from './speechContext'

function getSynthesis(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null
}

function pickSpanishVoice(synthesis: SpeechSynthesis) {
  const voices = synthesis.getVoices()
  const spanish = voices.filter((voice) => voice.lang.startsWith('es'))

  // Se prefiere una voz latinoamericana y que funcione sin señal.
  return (
    spanish.find((voice) => voice.localService && !voice.lang.endsWith('ES')) ??
    spanish.find((voice) => voice.localService) ??
    spanish[0] ??
    null
  )
}

/**
 * Lee textos en voz alta con la voz del propio celular (sin internet ni
 * servicios externos). Es el único lugar que conoce `speechSynthesis`.
 */
export function SpeechProvider({ children }: { children: ReactNode }) {
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const canSpeak = getSynthesis() !== null

  useEffect(() => {
    // Al salir de la app o de la pantalla no debe seguir hablando.
    return () => getSynthesis()?.cancel()
  }, [])

  const value = useMemo<SpeechContextValue>(
    () => ({
      state: { speakingId },
      actions: {
        speak: (id, text) => {
          const synthesis = getSynthesis()

          if (!synthesis) {
            return
          }

          synthesis.cancel()

          const utterance = new SpeechSynthesisUtterance(text)
          const voice = pickSpanishVoice(synthesis)

          utterance.voice = voice
          utterance.lang = voice?.lang ?? 'es-419'
          utterance.rate = 0.9
          utterance.onend = () =>
            setSpeakingId((current) => (current === id ? null : current))
          utterance.onerror = utterance.onend

          setSpeakingId(id)
          synthesis.speak(utterance)
        },
        stop: () => {
          getSynthesis()?.cancel()
          setSpeakingId(null)
        },
      },
      meta: { canSpeak },
    }),
    [canSpeak, speakingId],
  )

  return <SpeechContext value={value}>{children}</SpeechContext>
}
