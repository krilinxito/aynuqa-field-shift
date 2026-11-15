import { useCallback, useEffect, useRef, useState } from 'react'

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

/** Dictado por voz: entrega el texto escuchado a `onText`. */
export function useDictation(onText: (text: string) => void): Dictation {
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

    recognition.lang = 'es-BO'
    recognition.interimResults = false
    recognition.maxAlternatives = 1
    recognition.onresult = (event) => {
      const transcript = event.results[0]?.[0]?.transcript?.trim()

      if (transcript) {
        onText(transcript)
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
  }, [onText])

  const stop = useCallback(() => {
    recognitionRef.current?.abort()
    setIsListening(false)
  }, [])

  return { isSupported, isListening, start, stop }
}
