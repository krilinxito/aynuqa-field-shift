import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { useLanguage, type Language } from '../../app/i18n/languageContext'
import { SpeechContext, type SpeechContextValue } from './speechContext'

function getSynthesis(): SpeechSynthesis | null {
  return typeof window !== 'undefined' && 'speechSynthesis' in window
    ? window.speechSynthesis
    : null
}

function isSpanishVoice(voice: SpeechSynthesisVoice): boolean {
  const normalizedLang = voice.lang.toLowerCase().replace('_', '-')
  const name = voice.name.toLowerCase()
  return (
    normalizedLang.startsWith('es') ||
    name.includes('spanish') ||
    name.includes('español') ||
    name.includes('espanol')
  )
}

function pickSpanishVoice(
  synthesis: SpeechSynthesis,
): SpeechSynthesisVoice | null {
  const voices = synthesis.getVoices()
  const spanish = voices.filter(isSpanishVoice)

  const preferredOrder = [
    'es-bo',
    'es-pe',
    'es-mx',
    'es-us',
    'es-ar',
    'es-co',
    'es-cl',
    'es-419',
    'es-es',
  ]

  for (const tag of preferredOrder) {
    const match = spanish.find((v) =>
      v.lang.toLowerCase().replace('_', '-').startsWith(tag),
    )
    if (match) {
      return match
    }
  }

  return (
    spanish.find((voice) => voice.localService) ??
    spanish[0] ??
    null
  )
}

function adaptPhoneticsForLocalTts(text: string, lang: Language): string {
  if (lang === 'es') {
    return text
  }
  return text
    .replace(/ä/g, 'aa')
    .replace(/ï/g, 'ii')
    .replace(/ü/g, 'uu')
    .replace(/ch'|chh/gi, 'ch')
    .replace(/q'|qh|q/gi, 'j')
    .replace(/k'|kh/gi, 'k')
    .replace(/t'|th/gi, 't')
    .replace(/p'|ph/gi, 'p')
    .replace(/'/g, '')
}

/**
 * Lee textos en voz alta siempre en español claro (y fonética andina para
 * Aymara y Quechua). Cuando hay conexión con el backend usa `/api/tts` para
 * garantizar voz clara en español latinoamericano aunque el celular tenga
 * configurado el motor local en inglés; sin señal usa `speechSynthesis`.
 */
export function SpeechProvider({ children }: { children: ReactNode }) {
  const { lang } = useLanguage()
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const canSpeak =
    getSynthesis() !== null || typeof window !== 'undefined'

  useEffect(() => {
    const synthesis = getSynthesis()
    if (!synthesis) {
      return
    }
    // Precargar las voces del navegador apenas estén listas
    synthesis.getVoices()
    const handleVoicesChanged = () => {
      synthesis.getVoices()
    }
    synthesis.addEventListener?.('voiceschanged', handleVoicesChanged)
    return () => {
      synthesis.removeEventListener?.('voiceschanged', handleVoicesChanged)
      synthesis.cancel()
    }
  }, [])

  const stopAll = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause()
      audioRef.current.src = ''
      audioRef.current = null
    }
    getSynthesis()?.cancel()
    setSpeakingId(null)
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  const speakWithBrowser = useCallback(
    (id: string, text: string) => {
      const synthesis = getSynthesis()
      if (!synthesis) {
        setSpeakingId(null)
        return
      }

      synthesis.cancel()
      const spokenText = adaptPhoneticsForLocalTts(text, lang)
      const utterance = new SpeechSynthesisUtterance(spokenText)
      const voice = pickSpanishVoice(synthesis)

      // Importante: nunca asignar `utterance.voice = null`, porque en Chrome/Android
      // eso borra `utterance.lang` y hace que hable en inglés (`en-US`).
      if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang.replace('_', '-')
      } else {
        utterance.lang = 'es-MX'
      }

      utterance.rate = 0.9
      utterance.pitch = 1.0
      utterance.onend = () =>
        setSpeakingId((current) => (current === id ? null : current))
      utterance.onerror = utterance.onend

      setSpeakingId(id)
      synthesis.speak(utterance)
    },
    [lang],
  )

  const speak = useCallback(
    (id: string, text: string) => {
      stopAll()

      const isTest = import.meta.env.MODE === 'test'
      const isApiMode = import.meta.env.VITE_DATA_MODE === 'api'
      const isOnline =
        typeof navigator !== 'undefined' ? navigator.onLine : false

      if (!isTest && isApiMode && isOnline && typeof Audio !== 'undefined') {
        try {
          const base = (import.meta.env.VITE_API_BASE_URL || '/').replace(
            /\/$/,
            '',
          )
          const url = `${base}/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text.slice(0, 900))}`
          const audio = new Audio(url)
          audioRef.current = audio
          setSpeakingId(id)

          audio.onended = () => {
            setSpeakingId((current) => (current === id ? null : current))
          }
          audio.onerror = () => {
            audioRef.current = null
            speakWithBrowser(id, text)
          }

          void audio.play().catch(() => {
            audioRef.current = null
            speakWithBrowser(id, text)
          })
          return
        } catch {
          // Si falla Audio, usar la síntesis del navegador en español
        }
      }

      speakWithBrowser(id, text)
    },
    [lang, speakWithBrowser, stopAll],
  )

  const value = useMemo<SpeechContextValue>(
    () => ({
      state: { speakingId },
      actions: {
        speak,
        stop: stopAll,
      },
      meta: { canSpeak },
    }),
    [canSpeak, speak, speakingId, stopAll],
  )

  return <SpeechContext value={value}>{children}</SpeechContext>
}
