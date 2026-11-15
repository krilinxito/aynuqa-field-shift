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
  storedSectorId: string | null
}

/**
 * Decide qué sector está elegido: primero la URL, luego lo guardado en el
 * celular. Si ninguno es válido queda en `null`, para que la persona elija:
 * nunca se elige un sector por ella.
 */
export function resolveUrlState({
  search,
  availableSectorIds,
  storedSectorId,
}: ResolveUrlStateOptions): UrlState {
  const fromUrl = readUrlState(search)
  const selectedSectorId = availableSectorIds.includes(
    fromUrl.selectedSectorId ?? '',
  )
    ? fromUrl.selectedSectorId
    : availableSectorIds.includes(storedSectorId ?? '')
      ? storedSectorId
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
