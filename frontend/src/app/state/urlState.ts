import type { Scenario } from '../../data/repositories/DataRepository'
import { isSectorId } from '../../data/repositories/inputValidation'

export interface UrlState {
  selectedSectorId: string | null
  scenario: Scenario
}

function parseScenario(value: string | null): Scenario {
  return value === 'normal' || value === 'nino' ? value : 'nino'
}

export function readUrlState(search: string): UrlState {
  const params = new URLSearchParams(search)
  const sector = params.get('sector')

  return {
    selectedSectorId: isSectorId(sector) ? sector : null,
    scenario: parseScenario(params.get('scenario')),
  }
}

interface ResolveUrlStateOptions {
  search: string
  availableSectorIds: readonly string[]
}

/**
 * El sector solo vive en la URL (es el detalle que se está mirando).
 * Si no existe entre los sectores disponibles queda en `null`.
 */
export function resolveUrlState({
  search,
  availableSectorIds,
}: ResolveUrlStateOptions): UrlState {
  const fromUrl = readUrlState(search)
  const selectedSectorId = availableSectorIds.includes(
    fromUrl.selectedSectorId ?? '',
  )
    ? fromUrl.selectedSectorId
    : null

  return { ...fromUrl, selectedSectorId }
}

export function writeUrlState(state: UrlState): string {
  const params = new URLSearchParams()

  if (state.selectedSectorId) {
    params.set('sector', state.selectedSectorId)
  }

  params.set('scenario', state.scenario)

  return `?${params.toString()}`
}
