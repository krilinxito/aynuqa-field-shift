import { useCallback, useEffect, useRef, useState } from 'react'

import { useLanguage } from '../../app/i18n/languageContext'

/* Tipos mínimos del reconocimiento de voz del navegador. */
interface RecognitionResultEvent {
  results: ArrayLike<ArrayLike<{ transcript: string }>>
}

interface Recognition {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: RecognitionResultEvent) => void) | null
  onend: (() => void) | null
  onerror: (() => void) | null
  start: () => void
  abort: () => void
}

type RecognitionConstructor = new () => Recognition

function getRecognitionConstructor(): RecognitionConstructor | null {
  if (typeof window === 'undefined') {
    return null
  }

  const source = window as unknown as {
    SpeechRecognition?: RecognitionConstructor
    webkitSpeechRecognition?: RecognitionConstructor
  }

  return source.SpeechRecognition ?? source.webkitSpeechRecognition ?? null
}

export interface Dictation {
  /** `false` si el celular no puede escuchar: el botón no debe mostrarse. */
  isSupported: boolean
  isListening: boolean
  start: () => void
  stop: () => void
}

/**
 * Dictado por voz en español / lenguas andinas: captura la voz y usa el
 * pipeline BERT (`/api/translate`) cuando el idioma activo es Aymara o Quechua.
 */
export function useDictation(onText: (text: string) => void): Dictation {
  const { lang } = useLanguage()
  const [isListening, setIsListening] = useState(false)
  const recognitionRef = useRef<Recognition | null>(null)
  const isSupported = getRecognitionConstructor() !== null

  useEffect(() => () => recognitionRef.current?.abort(), [])

  const start = useCallback(() => {
    const RecognitionClass = getRecognitionConstructor()

    if (!RecognitionClass) {
      return
    }

    recognitionRef.current?.abort()

    const recognition = new RecognitionClass()

    recognition.lang = 'es-MX'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()

      if (!transcript) {
        return
      }

      onText(transcript)

      // Si la persona eligió Aymara o Quechua, traducir la voz con el pipeline BERT
      if (lang !== 'es' && import.meta.env.VITE_DATA_MODE === 'api') {
        const base = (import.meta.env.VITE_API_BASE_URL || '/').replace(
          /\/$/,
          '',
        )
        void window
          .fetch(`${base}/api/translate`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              text: transcript,
              target_lang: lang,
              source_lang: 'auto',
            }),
          })
          .then((res) => (res.ok ? res.json() : null))
          .then((data: { translated_text?: string } | null) => {
            if (data?.translated_text) {
              onText(data.translated_text)
            }
          })
          .catch(() => {
            // Si falla la traducción, conservar el texto dictado original
          })
      }
    }
    recognition.onend = () => setIsListening(false)
    recognition.onerror = () => setIsListening(false)
    recognitionRef.current = recognition
    setIsListening(true)

    try {
      recognition.start()
    } catch {
      setIsListening(false)
    }
  }, [lang, onText])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    setIsListening(false)
  }, [])

  return { isSupported, isListening, start, stop }
}
