import { useCallback, useMemo, useState, type ReactNode } from 'react'

import { readStored, storageKeys, writeStored } from '../state/deviceStorage'
import {
  PreferencesContext,
  defaultPreferences,
  type Preferences,
} from './preferencesContext'

function readPreferences(): Preferences {
  try {
    const raw = readStored(storageKeys.preferences)
    return raw
      ? { ...defaultPreferences, ...(JSON.parse(raw) as Partial<Preferences>) }
      : defaultPreferences
  } catch {
    return defaultPreferences
  }
}

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const [preferences, setPreferences] = useState<Preferences>(readPreferences)

  const setPreference = useCallback(
    <K extends keyof Preferences>(key: K, value: Preferences[K]) => {
      setPreferences((current) => {
        const next = { ...current, [key]: value }
        writeStored(storageKeys.preferences, JSON.stringify(next))
        return next
      })
    },
    [],
  )

  const value = useMemo(
    () => ({ preferences, setPreference }),
    [preferences, setPreference],
  )

  return <PreferencesContext value={value}>{children}</PreferencesContext>
}
