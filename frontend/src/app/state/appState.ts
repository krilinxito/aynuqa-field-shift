import type { Scenario } from '../../data/repositories/DataRepository'

export interface AppState {
  communityId: string | null
  selectedSectorId: string | null
  scenario: Scenario
}

export type AppStateAction =
  | { type: 'hydrate'; state: AppState }
  | { type: 'select-community'; communityId: string }
  | { type: 'select-sector'; sectorId: string }
  | { type: 'select-scenario'; scenario: Scenario }

export const defaultAppState: AppState = {
  communityId: null,
  selectedSectorId: null,
  scenario: 'nino',
}

export function appStateReducer(
  state: AppState,
  action: AppStateAction,
): AppState {
  switch (action.type) {
    case 'hydrate':
      return action.state
    case 'select-community':
      return { ...state, communityId: action.communityId }
    case 'select-sector':
      return { ...state, selectedSectorId: action.sectorId }
    case 'select-scenario':
      return { ...state, scenario: action.scenario }
  }
}
