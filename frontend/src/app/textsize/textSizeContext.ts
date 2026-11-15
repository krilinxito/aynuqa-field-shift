import { createContext, use } from 'react'

export type TextSize = 'normal' | 'grande'

export interface TextSizeContextValue {
  state: { size: TextSize }
  actions: { toggle: () => void }
}

export const TextSizeContext = createContext<TextSizeContextValue | null>(null)

export function useTextSize(): TextSizeContextValue {
  const value = use(TextSizeContext)

  if (!value) {
    throw new Error('useTextSize debe usarse dentro de TextSizeProvider.')
  }

  return value
}
