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

/** Voz en inglés del celular, si tiene una. */
function pickEnglishVoice(synthesis: SpeechSynthesis): SpeechSynthesisVoice | null {
  const voices = synthesis
    .getVoices()
    .filter((voice) => voice.lang.toLowerCase().replace('_', '-').startsWith('en'))
  return voices.find((voice) => voice.localService) ?? voices[0] ?? null
}

function adaptPhoneticsForLocalTts(text: string, lang: Language): string {
  if (lang === 'es' || lang === 'en') {
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

/** Toques más seguidos que esto se toman como uno solo (doble toque sin querer). */
const DOUBLE_TAP_MS = 400

function isRemoteTtsEnabled(): boolean {
  return (
    import.meta.env.MODE !== 'test' &&
    import.meta.env.VITE_DATA_MODE === 'api' &&
    typeof Audio !== 'undefined'
  )
}

function ttsUrl(text: string, lang: Language): string {
  const base = (import.meta.env.VITE_API_BASE_URL || '/').replace(/\/$/, '')
  return `${base}/api/tts?lang=${encodeURIComponent(lang)}&text=${encodeURIComponent(text.slice(0, 900))}`
}

/** Suelta un audio sin que sus eventos viejos vuelvan a disparar nada. */
function detachAudio(audio: HTMLAudioElement) {
  audio.onended = null
  audio.onerror = null
  audio.onplaying = null
  audio.pause()
  audio.removeAttribute('src')
}

interface SpeechProviderProps {
  children: ReactNode
  /** Solo para pruebas: fuerza o apaga la voz del servidor. */
  remoteTts?: boolean
}

/**
 * Lee textos en voz alta. Con señal usa `/api/tts` (voz clara aunque el
 * celular tenga el motor en inglés); sin señal o si falla, la voz del
 * navegador. Cada lectura tiene un número propio: cuando la persona para o
 * pide otra, los eventos de la lectura anterior se ignoran. Así un segundo
 * toque nunca vuelve a arrancar la voz.
 */
export function SpeechProvider({ children, remoteTts }: SpeechProviderProps) {
  const { lang } = useLanguage()
  const [speakingId, setSpeakingId] = useState<string | null>(null)
  const [loadingId, setLoadingId] = useState<string | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const requestRef = useRef(0)
  const lastTapRef = useRef(0)
  const canSpeak = typeof window !== 'undefined'

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

  /** Corta todo y deja inválidos los eventos pendientes. */
  const stopAll = useCallback(() => {
    requestRef.current += 1
    if (audioRef.current) {
      detachAudio(audioRef.current)
      audioRef.current = null
    }
    getSynthesis()?.cancel()
    setSpeakingId(null)
    setLoadingId(null)
  }, [])

  useEffect(() => () => stopAll(), [stopAll])

  const speakWithBrowser = useCallback(
    (request: number, id: string, text: string) => {
      if (request !== requestRef.current) {
        return
      }
      const synthesis = getSynthesis()
      if (!synthesis) {
        setSpeakingId(null)
        setLoadingId(null)
        return
      }

      synthesis.cancel()
      const utterance = new SpeechSynthesisUtterance(
        adaptPhoneticsForLocalTts(text, lang),
      )
      const voice =
        lang === 'en' ? pickEnglishVoice(synthesis) : pickSpanishVoice(synthesis)

      // Importante: nunca asignar `utterance.voice = null`, porque en Chrome/Android
      // eso borra `utterance.lang` y hace que hable en inglés (`en-US`).
      if (lang === 'en' && !voice) {
        utterance.lang = 'en-US'
      } else if (voice) {
        utterance.voice = voice
        utterance.lang = voice.lang.replace('_', '-')
      } else {
        utterance.lang = 'es-MX'
      }

      utterance.rate = 0.9
      utterance.pitch = 1.0
      const finish = () => {
        if (request === requestRef.current) {
          setSpeakingId(null)
        }
      }
      utterance.onend = finish
      utterance.onerror = finish

      setLoadingId(null)
      setSpeakingId(id)
      synthesis.speak(utterance)
    },
    [lang],
  )

  const startSpeaking = useCallback(
    (id: string, text: string) => {
      stopAll()
      const request = requestRef.current
      const useRemote = remoteTts ?? isRemoteTtsEnabled()
      const isOnline =
        typeof navigator !== 'undefined' ? navigator.onLine : false

      // La voz del servidor es para español, aymara y quechua; el inglés usa la del celular.
      if (!useRemote || !isOnline || lang === 'en') {
        speakWithBrowser(request, id, text)
        return
      }

      let fellBack = false
      const fallback = () => {
        // Una sola vez y solo si esta lectura sigue siendo la actual.
        if (fellBack || request !== requestRef.current) {
          return
        }
        fellBack = true
        if (audioRef.current) {
          detachAudio(audioRef.current)
          audioRef.current = null
        }
        speakWithBrowser(request, id, text)
      }

      const audio = new Audio(ttsUrl(text, lang))
      audioRef.current = audio
      setLoadingId(id)
      setSpeakingId(id)

      audio.onplaying = () => {
        if (request === requestRef.current) {
          setLoadingId(null)
        }
      }
      audio.onended = () => {
        if (request === requestRef.current) {
          audioRef.current = null
          setSpeakingId(null)
          setLoadingId(null)
        }
      }
      audio.onerror = fallback

      void audio.play().catch((error: unknown) => {
        // Pausar mientras carga rechaza play() con AbortError: no es un fallo.
        if (error instanceof DOMException && error.name === 'AbortError') {
          return
        }
        fallback()
      })
    },
    [lang, remoteTts, speakWithBrowser, stopAll],
  )

  /** Ignora un segundo toque demasiado seguido. */
  const acceptTap = useCallback(() => {
    const now = Date.now()
    if (now - lastTapRef.current < DOUBLE_TAP_MS) {
      return false
    }
    lastTapRef.current = now
    return true
  }, [])

  const speak = useCallback(
    (id: string, text: string) => {
      if (acceptTap()) {
        startSpeaking(id, text)
      }
    },
    [acceptTap, startSpeaking],
  )

  const stop = useCallback(() => {
    if (acceptTap()) {
      stopAll()
    }
  }, [acceptTap, stopAll])

  const value = useMemo<SpeechContextValue>(
    () => ({
      state: { speakingId, loadingId },
      actions: { speak, stop },
      meta: { canSpeak },
    }),
    [canSpeak, loadingId, speak, speakingId, stop],
  )

  return <SpeechContext value={value}>{children}</SpeechContext>
}
