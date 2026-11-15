import { describe, expect, it } from 'vitest'

import { adaptSectorSnapshot } from '../../data/adapters/sectorAdapter'
import { contractFixtures } from '../../data/contracts/contractFixtures'
import { parseContract } from '../../data/contracts/contractValidator'
import {
  groupByAction,
  groupByRisk,
  groupTwins,
  listWords,
  lowestConfidence,
  sectorsPhrase,
  spokenCommunitySummary,
  twinGroupText,
} from './communityText'

const nino = adaptSectorSnapshot(
  parseContract('sectorRisk', contractFixtures.sectorsNino),
)
const normal = adaptSectorSnapshot(
  parseContract('sectorRisk', contractFixtures.sectorsNormal),
)
const ids = (sectors: { id: string }[]) => sectors.map((sector) => sector.id)

describe('resumen de la comunidad', () => {
  it('enumera en español', () => {
    expect(listWords([])).toBe('')
    expect(listWords(['1'])).toBe('1')
    expect(listWords(['1', '2'])).toBe('1 y 2')
    expect(listWords(['1', '2', '3'])).toBe('1, 2 y 3')
    expect(sectorsPhrase(nino.sectors.slice(0, 1))).toBe('el sector 1')
    expect(sectorsPhrase(nino.sectors.slice(0, 3))).toBe('los sectores 1, 2 y 3')
  })

  it('agrupa por acción sin perder ni repetir sectores', () => {
    const groups = groupByAction(nino.sectors)

    expect(groups.map((group) => group.action)).toEqual([
      'open',
      'extend_rest',
      'keep_cultivating',
      'start_rest',
    ])
    expect(ids(groups[0].sectors)).toEqual(['S1', 'S2', 'S3'])
    expect(groups.flatMap((group) => ids(group.sectors)).sort()).toEqual(
      ids(nino.sectors).sort(),
    )
  })

  it('cuenta el riesgo por nivel, del más alto al más bajo, sin niveles vacíos', () => {
    const groups = groupByRisk(nino.sectors)

    expect(groups[0].level).toBe('high')
    expect(groups.every((group) => group.sectors.length > 0)).toBe(true)
    expect(groups.flatMap((group) => group.sectors)).toHaveLength(
      nino.sectors.length,
    )
  })

  it('muestra la confianza más prudente del grupo', () => {
    expect(lowestConfidence(['alta', 'media'])).toBe('media')
    expect(lowestConfidence(['alta', 'baja', 'media'])).toBe('baja')
    expect(lowestConfidence([])).toBeNull()
  })

  it('agrupa las tierras gemelas por tierra y evento', () => {
    const groups = groupTwins(nino.sectors)
    const machaca = groups.find((group) => group.zone === 'Jesús de Machaca')

    expect(groups).toHaveLength(4)
    expect(machaca).toBeDefined()
    expect(ids(machaca!.sectors)).toEqual(['S1', 'S5'])
    expect(machaca!.confidence).toBe('media')
  })

  it('cuenta el precedente sin promediar: separa resultados distintos', () => {
    const machaca = groupTwins(nino.sectors).find(
      (group) => group.zone === 'Jesús de Machaca',
    )!
    const text = twinGroupText(machaca)

    // S1 (-0,67) estuvo por debajo; S5 (-0,42) cerca de lo normal.
    expect(text).toContain('Se parece a los sectores 1 y 5.')
    expect(text).toContain('El Niño de 2015-16')
    expect(text).toContain('estuvo por debajo de lo normal en la tierra parecida al sector 1')
    expect(text).toContain('estuvo cerca de lo normal en la tierra parecida al sector 5')
    expect(text).not.toMatch(/%|cosecha|rendimiento|pérdida/)
  })

  it('en el año normal no hay tierras gemelas', () => {
    expect(groupTwins(normal.sectors)).toEqual([])
  })

  it('arma un resumen para escuchar', () => {
    const text = spokenCommunitySummary('Pumani', nino.sectors, 'nino')

    expect(text).toContain('Comunidad de Pumani.')
    expect(text).toContain('Abrir para cultivo: los sectores 1, 2 y 3.')
    expect(text).toContain('aumenta la probabilidad de sequía')
    expect(text).toContain('La confianza más baja')
  })
})
