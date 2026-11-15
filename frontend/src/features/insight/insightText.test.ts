import { describe, expect, it } from 'vitest'

import { adaptSectorSnapshot } from '../../data/adapters/sectorAdapter'
import { contractFixtures } from '../../data/contracts/contractFixtures'
import { parseContract } from '../../data/contracts/contractValidator'
import {
  confidenceText,
  ninoText,
  recommendationDetails,
  riskExplanation,
  rotationText,
  spokenSummary,
  twinText,
  weatherLines,
  years,
} from './insightText'

const nino = adaptSectorSnapshot(
  parseContract('sectorRisk', contractFixtures.sectorsNino),
)
const normal = adaptSectorSnapshot(
  parseContract('sectorRisk', contractFixtures.sectorsNormal),
)
const sector = (id: string) => {
  const found = nino.sectors.find((candidate) => candidate.id === id)

  if (!found) {
    throw new Error(`Falta ${id} en el fixture`)
  }

  return found
}

describe('frases del consejo', () => {
  it('cuenta los años en singular y plural', () => {
    expect(years(1)).toBe('1 año')
    expect(years(10)).toBe('10 años')
    expect(rotationText(sector('S6'))).toBe('En descanso hace 1 año')
    expect(rotationText(sector('S7'))).toBe('En cultivo hace 2 años')
  })

  it('solo menciona cultivo, siembra o descanso extra si el dato existe', () => {
    expect(recommendationDetails(sector('S1'))).toEqual([
      'Cultivo sugerido: quinua.',
      'Siembra: octubre a noviembre.',
    ])
    expect(recommendationDetails(sector('S6'))).toEqual([
      'Descanso sugerido: 2 años más.',
    ])
    expect(recommendationDetails(sector('S8'))).toEqual([])
  })

  it('nunca afirma la sequía como segura', () => {
    expect(riskExplanation('nino')).toContain('aumenta la probabilidad')
    expect(riskExplanation('nino')).toContain('No es seguro')
  })

  it('explica cada nivel de confianza', () => {
    expect(confidenceText('baja')).toMatch(/^Confianza baja\./)
    expect(confidenceText('media')).toMatch(/^Confianza media\./)
    expect(confidenceText('alta')).toMatch(/^Confianza alta\./)
  })

  it('cuenta el precedente con el verdor observado, sin cultivos ni pérdidas', () => {
    const twin = sector('S1').twinPrecedent

    expect(twin).not.toBeNull()

    const text = twinText(twin!)

    expect(text).toContain('Jesús de Machaca')
    expect(text).toContain('El Niño de 2015-16')
    expect(text).toContain('por debajo de lo normal')
    expect(text).not.toMatch(/%|cosecha|rendimiento|pérdida/)
  })

  it('distingue El Niño observado de la comparación', () => {
    expect(ninoText(nino.zone)).toBe('El Niño está fuerte (índice 1,97).')
    expect(ninoText(normal.zone)).toContain('Comparación')
  })

  it('dice "sin dato" cuando falta un valor del clima', () => {
    const zone = structuredClone(nino.zone)

    zone.climate.precipitation = { value: null, text: '', unit: 'mm' }

    const [rain, temperature] = weatherLines(zone)

    expect(rain.text).toBe('sin dato')
    expect(temperature.text).toBe('9,6 °C, 0,9 °C más que lo normal')
    expect(weatherLines(nino.zone)[0].text).toBe(
      '11,4 mm, 38 % menos que lo normal',
    )
  })

  it('arma un resumen para escuchar con consejo, riesgo y confianza', () => {
    const text = spokenSummary(sector('S4'), 'nino')

    expect(text).toContain('Sector 4')
    expect(text).toContain('Mantener este sector en descanso.')
    expect(text).toContain('Riesgo de sequía: alto')
    expect(text).toContain('Confianza media')
  })
})
