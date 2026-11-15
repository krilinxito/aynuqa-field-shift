import { useCallback, useEffect, useMemo, useState, type ReactNode } from 'react'

import {
  LanguageContext,
  UI_STRINGS,
  translatePhrase,
  type Language,
  type LanguageContextValue,
} from './languageContext'

const storageKey = 'aynuqa:lang'

function readStoredLanguage(): Language {
  try {
    const raw = localStorage.getItem(storageKey)
    if (raw === 'ay' || raw === 'qu' || raw === 'es') {
      return raw
    }
  } catch {
    // Ignorar si localStorage no está disponible
  }
  return 'es'
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Language>(readStoredLanguage)

  const setLang = useCallback((next: Language) => {
    setLangState(next)
    try {
      localStorage.setItem(storageKey, next)
    } catch {
      // Ignorar
    }
  }, [])

  useEffect(() => {
    document.documentElement.lang = lang
  }, [lang])

  const tr = useCallback(
    (text: string) => translatePhrase(text, lang),
    [lang],
  )

  const value = useMemo<LanguageContextValue>(
    () => ({
      lang,
      setLang,
      t: UI_STRINGS[lang],
      tr,
    }),
    [lang, setLang, tr],
  )

  return <LanguageContext value={value}>{children}</LanguageContext>
}
