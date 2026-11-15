import { describe, expect, it } from 'vitest'

import { readUrlState, resolveUrlState, writeUrlState } from './urlState'

const sectors = ['S1', 'S2', 'S3']

describe('estado compartido y URL', () => {
  it.each(['nino', 'normal'] as const)(
    'acepta el escenario %s y un sector disponible',
    (scenario) => {
      const state = resolveUrlState({
        search: `?sector=S3&scenario=${scenario}`,
        availableSectorIds: sectors,
        storedSectorId: 'S2',
      })

      expect(state).toEqual({ selectedSectorId: 'S3', scenario })
    },
  )

  it('usa la última selección guardada si la URL no trae un sector válido', () => {
    const state = resolveUrlState({
      search: '?sector=S99&scenario=nino',
      availableSectorIds: sectors,
      storedSectorId: 'S2',
    })

    expect(state.selectedSectorId).toBe('S2')
  })

  it('no elige un sector por la persona si nada es válido', () => {
    const state = resolveUrlState({
      search: '?sector=otro&scenario=desconocido',
      availableSectorIds: sectors,
      storedSectorId: 'S8',
    })

    expect(state).toEqual({ selectedSectorId: null, scenario: 'nino' })
  })

  it('escribe y vuelve a leer el mismo estado', () => {
    const search = writeUrlState({ selectedSectorId: 'S2', scenario: 'normal' })

    expect(search).toBe('?sector=S2&scenario=normal')
    expect(readUrlState(search)).toEqual({
      selectedSectorId: 'S2',
      scenario: 'normal',
    })
  })

  it('omite el sector cuando todavía no se eligió', () => {
    expect(writeUrlState({ selectedSectorId: null, scenario: 'nino' })).toBe(
      '?scenario=nino',
    )
  })
})
