import { describe, expect, it } from 'vitest'

import { contractFixtures } from './contractFixtures'
import { getContractValidator, parseContract } from './contractValidator'
import { ContractError } from '../transport/errors'

describe('contratos oficiales', () => {
  it.each([
    ['sectorRisk', contractFixtures.sectorsNino],
    ['sectorRisk', contractFixtures.sectorsNormal],
    ['history', contractFixtures.historyS1],
    ['sensors', contractFixtures.sensorsS1],
    ['backtest', contractFixtures.backtest2015],
    ['chatRequest', contractFixtures.chatRequest],
    ['chatResponse', contractFixtures.chatResponse],
    ['health', contractFixtures.health],
    ['apiError', contractFixtures.apiError],
    ['twinPrecedent', contractFixtures.twinPrecedent],
  ] as const)('valida el fixture %s', (schema, fixture) => {
    expect(() => parseContract(schema, fixture)).not.toThrow()
  })

  it('resuelve la referencia local a $defs/twin_precedent', () => {
    const response = parseContract('sectorRisk', contractFixtures.sectorsNino)

    expect(response.sectors[0].twin_precedent).not.toBeNull()
  })

  it('preserva y acepta null donde el contrato lo permite', () => {
    const history = parseContract('history', contractFixtures.historyS1)
    const normal = parseContract('sectorRisk', contractFixtures.sectorsNormal)

    expect(history.series.some((point) => point.ndvi === null)).toBe(true)
    expect(normal.sectors.every((sector) => sector.twin_precedent === null)).toBe(
      true,
    )
  })

  it.each([
    ['campo requerido ausente', { ...contractFixtures.health, status: undefined }],
    ['propiedad adicional', { ...contractFixtures.health, extra: true }],
    ['const inválida', { ...contractFixtures.health, status: 'warning' }],
    [
      'fecha incorrecta',
      { ...contractFixtures.health, updated_at: '14/11/2026' },
    ],
    [
      'enum inválido',
      { ...contractFixtures.sectorsNino, scenario: 'future' },
    ],
    [
      'valor fuera de rango',
      { ...contractFixtures.twinPrecedent, similarity: 2 },
    ],
    ['tipo incompatible', { ...contractFixtures.sensorsS1, hours: '48' }],
  ])('rechaza %s', (_caseName, invalidFixture) => {
    const schema =
      'scenario' in invalidFixture
        ? 'sectorRisk'
        : 'similarity' in invalidFixture
          ? 'twinPrecedent'
          : 'hours' in invalidFixture
            ? 'sensors'
            : 'health'

    expect(() => parseContract(schema, invalidFixture)).toThrow(ContractError)
  })

  it('expone errores de AJV 2020 para propiedades adicionales', () => {
    const validator = getContractValidator('health')
    validator({ ...contractFixtures.health, extra: true })

    expect(validator.errors?.[0]?.keyword).toBe('additionalProperties')
  })
})
