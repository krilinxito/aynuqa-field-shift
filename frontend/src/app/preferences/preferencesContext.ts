import { createContext, use } from 'react'

/** Preferencias de la persona, guardadas en el celular. */
export interface Preferences {
  /** Muestra números y términos técnicos. */
  advanced: boolean
  /** La llamita habla por iniciativa propia. */
  mascotTalkative: boolean
  /** La llamita lee sus frases en voz alta sola. */
  mascotAutoSpeak: boolean
  /** Avisos con la app cerrada (si el celular lo permite). */
  mascotNotify: boolean
}

export interface PreferencesContextValue {
  preferences: Preferences
  setPreference: <K extends keyof Preferences>(key: K, value: Preferences[K]) => void
}

export const defaultPreferences: Preferences = {
  advanced: false,
  mascotTalkative: true,
  mascotAutoSpeak: false,
  mascotNotify: false,
}

export const PreferencesContext = createContext<PreferencesContextValue>({
  preferences: defaultPreferences,
  setPreference: () => {},
})

export function usePreferences(): PreferencesContextValue {
  return use(PreferencesContext)
}
