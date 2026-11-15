import { useCallback, useMemo, useRef, useState, type ReactNode } from 'react'

import { useDataLayer } from '../../app/providers/dataRepositoryContext'
import type { Scenario } from '../../data/repositories/DataRepository'
import { useOnline } from '../../shared/hooks/useOnline'
import {
  ChatContext,
  type ChatContextValue,
  type ChatMessage,
} from './chatContext'
import { chatErrorText } from './chatErrors'

const maxLength = 1000
// El asistente consulta varias herramientas antes de contestar: puede tardar.
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
 * Único lugar que sabe cómo se habla con el asistente. El chat no guarda
 * historial en el servidor: cada pregunta se responde por separado, y la
 * conversación en pantalla vive solo mientras la pantalla está abierta.
 */
export function ChatProvider({
  sectorId,
  sectorNumber,
  scenario,
  children,
}: ChatProviderProps) {
  const { repository } = useDataLayer()
  const isOnline = useOnline()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [draft, setDraft] = useState('')
  const [isSending, setIsSending] = useState(false)
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

      if (!isOnline) {
        append({
          role: 'notice',
          text: 'No hay señal. La llamita necesita señal para contestar. Los datos de su sector sí se pueden ver sin señal.',
        })
        return
      }

      setIsSending(true)
      repository
        .sendChat(
          sectorId
            ? { message, sector_id: sectorId, scenario }
            : { message, scenario },
          { timeoutMs: chatTimeoutMs },
        )
        .then((response) => {
          append({
            role: 'assistant',
            text: response.answer,
            confidenceNote: response.confidence_note,
          })
        })
        .catch((error: unknown) => {
          append({ role: 'notice', text: chatErrorText(error) })
        })
        .finally(() => setIsSending(false))
    },
    [append, isOnline, isSending, repository, scenario, sectorId],
  )

  const suggestions = useMemo(
    () =>
      sectorNumber
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
          ],
    [sectorNumber],
  )

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
