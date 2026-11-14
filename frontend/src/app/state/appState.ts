import type {
  AnalysisSection,
  DateRange,
  Scenario,
} from '../../data/repositories/DataRepository'

export interface AppState {
  selectedSectorId: string | null
  scenario: Scenario
  dateRange: DateRange | null
  analysisSection: AnalysisSection
}

export type AppStateAction =
  | { type: 'hydrate'; state: AppState }
  | { type: 'select-sector'; sectorId: string }
  | { type: 'select-scenario'; scenario: Scenario }
  | { type: 'set-date-range'; dateRange: DateRange | null }
  | { type: 'set-analysis-section'; section: AnalysisSection }

export const defaultAppState: AppState = {
  selectedSectorId: null,
  scenario: 'nino',
  dateRange: null,
  analysisSection: 'history',
}

export function appStateReducer(
  state: AppState,
  action: AppStateAction,
): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state
    case 'select-sector':
      return { ...state, selectedSectorId: action.sectorId }
    case 'select-scenario':
      return { ...state, scenario: action.scenario }
    case 'set-date-range':
      return { ...state, dateRange: action.dateRange }
    case 'set-analysis-section':
      return { ...state, analysisSection: action.section }
  }
}
