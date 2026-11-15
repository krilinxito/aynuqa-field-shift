import { createContext, use } from 'react'

export interface SpeechContextValue {
  state: {
    /** Identificador del texto que se está leyendo, o `null`. */
    speakingId: string | null
    /** Texto cuyo audio todavía se está descargando, o `null`. */
    loadingId: string | null
  }
  actions: {
    speak: (id: string, text: string) => void
    stop: () => void
  }
  meta: {
    /** `false` si el celular no puede leer en voz alta. */
    canSpeak: boolean
  }
}

export const SpeechContext = createContext<SpeechContextValue | null>(null)

export function useSpeech(): SpeechContextValue {
  const value = use(SpeechContext)

  if (!value) {
    throw new Error('useSpeech debe usarse dentro de SpeechProvider.')
  }

  return value
}
