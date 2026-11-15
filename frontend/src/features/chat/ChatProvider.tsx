import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'

import { usePreferences } from '../../app/preferences/preferencesContext'
import { useLanguage } from '../../app/i18n/languageContext'
import { useDataLayer } from '../../app/providers/dataRepositoryContext'
import type { Scenario } from '../../data/repositories/DataRepository'
import { useOnline } from '../../shared/hooks/useOnline'
import {
  ChatContext,
  type ChatContextValue,
  type ChatMessage,
} from './chatContext'
import { mascotSignals } from '../mascot/mascotSignals'
import { adaptSectorSnapshot } from '../../data/adapters/sectorAdapter'
import { NetworkError, TimeoutError } from '../../data/transport/errors'
import { chatErrorText } from './chatErrors'
import { answerOffline as answerOffline_ } from './offline/answerOffline'

const maxLength = 1000
const chatTimeoutMs = 45_000

interface ChatProviderProps {
  /** Sector sobre el que se pregunta, o `null` para toda la comunidad. */
  sectorId: string | null
  /** Número del sector, para las preguntas sugeridas. */
  sectorNumber: string | null
  scenario: Scenario
  children: ReactNode
}

/**
 * Único lugar que sabe cómo se habla con el asistente. Soporta Español, Aymara
 * y Quechua enviando la etiqueta de idioma al pipeline BERT + Gemini del backend.
 */
export function ChatProvider({
  sectorId,
  sectorNumber,
  scenario,
  children,
}: ChatProviderProps) {
  const { repository } = useDataLayer()
  const { lang } = useLanguage()
  const { preferences } = usePreferences()
  const isApiMode =
    (import.meta.env.VITE_DATA_MODE ?? '').toLowerCase() === 'api'
  const isOnline = useOnline()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)

  // La llamita pone cara de pensar mientras espera la respuesta.
  useEffect(() => {
    mascotSignals.setThinking(isSending)
    return () => mascotSignals.setThinking(false)
  }, [isSending])
  const nextId = useRef(0)

  const append = useCallback((message: Omit<ChatMessage, 'id'>) => {
    nextId.current += 1
    const id = `mensaje-${nextId.current}`

    setMessages((current) => [...current, { ...message, id }])
  }, [])

  const send = useCallback(
    (text: string) => {
      const message = text.trim().slice(0, maxLength)

      if (!message || isSending) {
        return
      }

      append({ role: 'user', text: message })
      setDraft('')

      // Sin señal (o si falla la red) la llamita contesta con lo guardado.
      const answerOffline = async () => {
        try {
          const snapshot = adaptSectorSnapshot(await repository.getSectors(scenario))
          const local = await answerOffline_(message, snapshot, { sectorId, lang })
          append({
            role: 'assistant',
            text: local.text,
            confidenceNote: local.confidenceNote,
          })
        } catch {
          append({ role: 'notice', text: chatErrorText(new NetworkError()) })
        }
      }

      if (!isOnline) {
        setIsSending(true)
        void answerOffline().finally(() => setIsSending(false))
        return
      }

      // En modo API, si el idioma activo es Aymara o Quechua, anteponemos
      // [lang:ay] o [lang:qu] para que el pipeline BERT del backend responda
      // en ese idioma sin alterar el schema JSON del contrato.
      // Con el modo avanzado, [modo:avanzado] pide números técnicos.
      const tags = isApiMode
        ? `${preferences.advanced ? '[modo:avanzado] ' : ''}${lang !== 'es' ? `[lang:${lang}] ` : ''}`
        : ''
      const outboundMessage = `${tags}${message}`.slice(0, maxLength)

      setIsSending(true)
      repository
        .sendChat(
          sectorId
            ? { message: outboundMessage, sector_id: sectorId, scenario }
            : { message: outboundMessage, scenario },
          { timeoutMs: chatTimeoutMs },
        )
        .then((response) => {
          append({
            role: 'assistant',
            text: response.answer,
            confidenceNote: response.confidence_note,
          })
        })
        .catch(async (error: unknown) => {
          if (error instanceof NetworkError || error instanceof TimeoutError) {
            await answerOffline()
            return
          }
          append({ role: 'notice', text: chatErrorText(error) })
        })
        .finally(() => setIsSending(false))
    },
    [
      append,
      isApiMode,
      isOnline,
      isSending,
      lang,
      preferences.advanced,
      repository,
      scenario,
      sectorId,
    ],
  )

  const suggestions = useMemo(() => {
    if (lang === 'ay') {
      return sectorNumber
        ? [
            `¿Aka jichha maran Suyu ${sectorNumber} yapuchañataki llawiraña wakisiti?`,
            `¿Kunatsa Suyu ${sectorNumber} ukan waña pacha jutaspäna?`,
            `¿Kunsa Suyu ${sectorNumber} ukan yapuchasispa ukat kunapachasa?`,
            `¿Kunas Suyu ${sectorNumber} kikpa uraqin pasäna?`,
          ]
        : [
            '¿Kawkïri suyunakanasa jichha maran yapuchañataki llawiraña wakisi?',
            '¿Kunatsa jichha maran waña pacha jutaspäna?',
            '¿Kunas kikpa uraqinakan El Niño pachan pasäna?',
            '¿Kunsa yapuchasispa ukat kunapachasa?',
          ]
    }

    if (lang === 'qu') {
      return sectorNumber
        ? [
            `¿Kunan wata Suyu ${sectorNumber} tarpunapaq kichariy allinchu kanman?`,
            `¿Imaraykutaq Suyu ${sectorNumber} nisqapi ch'aki pacha kanman?`,
            `¿Imatataq Suyu ${sectorNumber} nisqapi tarpusunman chaymanta hayk'aqtaq?`,
            `¿Imataq Suyu ${sectorNumber} kikillan allpapi karqan?`,
          ]
        : [
            '¿Mayqin suyukunatataq kunan wata tarpunapaq kichariy allin kanman?',
            "¿Imaraykutaq kunan wata ch'aki pacha kanman?",
            '¿Imataq kikillan allpakunapi El Niño pachapi karqan?',
            "¿Imatataq tarpusunman chaymanta hayk'aqtaq?",
          ]
    }

    if (lang === 'en') {
      return sectorNumber
        ? [
            `Should we open field ${sectorNumber} this year?`,
            `Why is there drought risk in field ${sectorNumber}?`,
            `What can we plant in field ${sectorNumber}, and when?`,
            `What happened on the twin land of field ${sectorNumber}?`,
          ]
        : [
            'Which fields should we open this year?',
            'Why is there drought risk this year?',
            'What happened on the twin lands during El Niño?',
            'What can we plant, and when?',
          ]
    }

    return sectorNumber
      ? [
          `¿Conviene abrir el sector ${sectorNumber} este año?`,
          `¿Por qué hay riesgo de sequía en el sector ${sectorNumber}?`,
          `¿Qué se puede sembrar en el sector ${sectorNumber} y cuándo?`,
          `¿Qué pasó en la tierra gemela del sector ${sectorNumber}?`,
        ]
      : [
          '¿Qué sectores conviene abrir este año?',
          '¿Por qué hay riesgo de sequía este año?',
          '¿Qué pasó en las tierras gemelas durante El Niño?',
          '¿Qué se puede sembrar y cuándo?',
        ]
  }, [lang, sectorNumber])

  const value = useMemo<ChatContextValue>(
    () => ({
      state: { messages, draft, isSending },
      actions: { setDraft, send },
      meta: { isOnline, suggestions, maxLength },
    }),
    [draft, isOnline, isSending, messages, send, suggestions],
  )

  return <ChatContext value={value}>{children}</ChatContext>
}
