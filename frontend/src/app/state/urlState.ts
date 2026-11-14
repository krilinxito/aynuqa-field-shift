import type {
  AnalysisSection,
  DateRange,
  Scenario,
} from '../../data/repositories/DataRepository'
import { isSectorId, isYearMonth } from '../../data/repositories/inputValidation'
import { defaultAppState, type AppState } from './appState'

const analysisSections = new Set<AnalysisSection>([
  'history',
  'backtest',
  'twins',
  'sensors',
])

function parseScenario(value: string | null): Scenario {
  return value === 'normal' || value === 'nino' ? value : 'nino'
}

function parseDateRange(params: URLSearchParams): DateRange | null {
  const from = params.get('from')
  const to = params.get('to')

  if ((from !== null && !isYearMonth(from)) || (to !== null && !isYearMonth(to))) {
    return null
  }

  if (from !== null && to !== null && from > to) {
    return null
  }

  return from === null && to === null
    ? null
    : { from: from ?? undefined, to: to ?? undefined }
}

export function readUrlState(search: string, pathname: string): AppState {
  const params = new URLSearchParams(search)
  const sector = params.get('sector')
  const section = params.get('section')
  const isAnalysis = pathname === '/analisis'

  return {
    selectedSectorId: isSectorId(sector) ? sector : null,
    scenario: parseScenario(params.get('scenario')),
    dateRange: isAnalysis ? parseDateRange(params) : null,
    analysisSection:
      isAnalysis && analysisSections.has(section as AnalysisSection)
        ? (section as AnalysisSection)
        : defaultAppState.analysisSection,
  }
}

interface ResolveAppStateOptions {
  search: string
  pathname: string
  availableSectorIds: readonly string[]
  storedSectorId: string | null
}

export function resolveAppState({
  search,
  pathname,
  availableSectorIds,
  storedSectorId,
}: ResolveAppStateOptions): AppState {
  const fromUrl = readUrlState(search, pathname)
  const selectedSectorId = availableSectorIds.includes(
    fromUrl.selectedSectorId ?? '',
  )
    ? fromUrl.selectedSectorId
    : availableSectorIds.includes(storedSectorId ?? '')
      ? storedSectorId
      : (availableSectorIds[0] ?? null)

  return { ...fromUrl, selectedSectorId }
}

export function writeUrlState(state: AppState, pathname: string): string {
  const params = new URLSearchParams()

  if (state.selectedSectorId) {
    params.set('sector', state.selectedSectorId)
  }

  params.set('scenario', state.scenario)

  if (pathname === '/analisis') {
    if (state.dateRange?.from) {
      params.set('from', state.dateRange.from)
    }

    if (state.dateRange?.to) {
      params.set('to', state.dateRange.to)
    }

    params.set('section', state.analysisSection)
  }

  const result = params.toString()
  return result ? `?${result}` : ''
}
