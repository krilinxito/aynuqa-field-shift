import { createContext, use } from 'react'

import type { QueryStatus } from '../../data/cache/QueryClient'
import type { Scenario } from '../../data/repositories/DataRepository'
import type { AppState } from '../state/appState'

export interface AppStateContextValue {
  state: AppState
  actions: {
    selectCommunity: (communityId: string) => void
    /** Abre el detalle de un sector. */
    openSector: (sectorId: string) => void
    selectScenario: (scenario: Scenario) => void
  }
  meta: {
    availableSectorIds: readonly string[]
    sectorsStatus: QueryStatus
    sectorsError?: unknown
  }
}

export const AppStateContext = createContext<AppStateContextValue | null>(null)

export function useAppState(): AppStateContextValue {
  const value = use(AppStateContext)

  if (!value) {
    throw new Error('useAppState debe usarse dentro de AppStateProvider.')
  }

  return value
}
