import { useEffect, useMemo, useState, type ReactNode } from 'react'

import { readStored, storageKeys, writeStored } from '../state/deviceStorage'
import {
  TextSizeContext,
  type TextSize,
  type TextSizeContextValue,
} from './textSizeContext'

/** Recuerda si la persona pidió letra más grande y lo aplica a toda la app. */
export function TextSizeProvider({ children }: { children: ReactNode }) {
  const [size, setSize] = useState<TextSize>(() =>
    readStored(storageKeys.textSize) === 'grande' ? 'grande' : 'normal',
  )

  useEffect(() => {
    document.documentElement.dataset.letra = size
    writeStored(storageKeys.textSize, size)
  }, [size])

  const value = useMemo<TextSizeContextValue>(
    () => ({
      state: { size },
      actions: {
        toggle: () =>
          setSize((current) => (current === 'grande' ? 'normal' : 'grande')),
      },
    }),
    [size],
  )

  return <TextSizeContext value={value}>{children}</TextSizeContext>
}
