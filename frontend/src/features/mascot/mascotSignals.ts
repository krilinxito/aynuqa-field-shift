import { useSyncExternalStore } from 'react'

/**
 * Señales globales para la llamita: otras partes de la app le avisan que
 * está pensando (chat) o que hay algo que celebrar (decisión guardada).
 */
interface MascotSignals {
  thinking: boolean
  celebrateAt: number
}

let state: MascotSignals = { thinking: false, celebrateAt: 0 }
const listeners = new Set<() => void>()

function emit(next: Partial<MascotSignals>) {
  state = { ...state, ...next }
  listeners.forEach((listener) => listener())
}

export const mascotSignals = {
  setThinking: (thinking: boolean) => {
    if (state.thinking !== thinking) emit({ thinking })
  },
  celebrate: () => emit({ celebrateAt: Date.now() }),
}

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function useMascotSignals(): MascotSignals {
  return useSyncExternalStore(
    subscribe,
    () => state,
    () => state,
  )
}
