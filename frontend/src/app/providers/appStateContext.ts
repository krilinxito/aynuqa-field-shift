import { createContext, useContext } from 'react'

import type { QueryStatus } from '../../data/cache/QueryClient'
import type {
  AnalysisSection,
  DateRange,
  Scenario,
} from '../../data/repositories/DataRepository'
import type { AppState } from '../state/appState'

export interface AppStateContextValue extends AppState {
  availableSectorIds: readonly string[]
  sectorsStatus: QueryStatus
  sectorsError?: unknown
  selectSector: (sectorId: string) => void
  selectScenario: (scenario: Scenario) => void
  setDateRange: (range: DateRange | null) => void
  setAnalysisSection: (section: AnalysisSection) => void
}

export const AppStateContext = createContext<AppStateContextValue | null>(null)

export function useAppState(): AppStateContextValue {
  const value = useContext(AppStateContext)

  if (!value) {
    throw new Error('useAppState debe usarse dentro de AppStateProvider.')
  }

  return value
}
