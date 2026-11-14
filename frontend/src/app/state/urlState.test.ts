import { describe, expect, it } from 'vitest'

import { resolveAppState, writeUrlState } from './urlState'

const sectors = ['S1', 'S2', 'S3']

describe('estado compartido y URL', () => {
  it.each(['nino', 'normal'] as const)(
    'acepta el escenario %s y un sector disponible',
    (scenario) => {
      const state = resolveAppState({
        search: `?sector=S3&scenario=${scenario}`,
        pathname: '/territorio',
        availableSectorIds: sectors,
        storedSectorId: 'S2',
      })

      expect(state).toMatchObject({ selectedSectorId: 'S3', scenario })
    },
  )

  it('prioriza la última selección local si la URL no contiene un sector válido', () => {
    const state = resolveAppState({
      search: '?sector=S99&scenario=nino',
      pathname: '/territorio',
      availableSectorIds: sectors,
      storedSectorId: 'S2',
    })

    expect(state.selectedSectorId).toBe('S2')
  })

  it('usa el primer sector si URL y almacenamiento son inválidos', () => {
    const state = resolveAppState({
      search: '?sector=otro&scenario=desconocido',
      pathname: '/territorio',
      availableSectorIds: sectors,
      storedSectorId: 'S8',
    })

    expect(state).toMatchObject({ selectedSectorId: 'S1', scenario: 'nino' })
  })

  it('valida rango y sección solo en análisis', () => {
    const valid = resolveAppState({
      search:
        '?sector=S1&scenario=nino&from=2020-01&to=2021-02&section=sensors',
      pathname: '/analisis',
      availableSectorIds: sectors,
      storedSectorId: null,
    })
    const invalid = resolveAppState({
      search:
        '?sector=S1&scenario=nino&from=2022-13&to=2020-01&section=otro',
      pathname: '/analisis',
      availableSectorIds: sectors,
      storedSectorId: null,
    })
    const territory = resolveAppState({
      search:
        '?sector=S1&scenario=nino&from=2020-01&to=2021-02&section=sensors',
      pathname: '/territorio',
      availableSectorIds: sectors,
      storedSectorId: null,
    })

    expect(valid.dateRange).toEqual({ from: '2020-01', to: '2021-02' })
    expect(valid.analysisSection).toBe('sensors')
    expect(invalid.dateRange).toBeNull()
    expect(invalid.analysisSection).toBe('history')
    expect(territory.dateRange).toBeNull()
    expect(territory.analysisSection).toBe('history')
  })

  it('serializa únicamente parámetros aplicables a la ruta', () => {
    const state = {
      selectedSectorId: 'S1',
      scenario: 'normal' as const,
      dateRange: { from: '2020-01', to: '2020-12' },
      analysisSection: 'backtest' as const,
    }

    expect(writeUrlState(state, '/territorio')).toBe(
      '?sector=S1&scenario=normal',
    )
    expect(writeUrlState(state, '/analisis')).toBe(
      '?sector=S1&scenario=normal&from=2020-01&to=2020-12&section=backtest',
    )
  })
})
