import { createContext, use } from 'react'

export interface ChatMessage {
  id: string
  /** `notice` es un aviso de la app (sin señal, error), no una respuesta. */
  role: 'user' | 'assistant' | 'notice'
  text: string
  confidenceNote?: string
}

export interface ChatContextValue {
  state: {
    messages: readonly ChatMessage[]
    draft: string
    isSending: boolean
  }
  actions: {
    setDraft: (draft: string) => void
    send: (text: string) => void
  }
  meta: {
    isOnline: boolean
    suggestions: readonly string[]
    maxLength: number
  }
}

export const ChatContext = createContext<ChatContextValue | null>(null)

export function useChat(): ChatContextValue {
  const value = use(ChatContext)

  if (!value) {
    throw new Error('Las piezas de Chat van dentro de Chat.Provider.')
  }

  return value
}
