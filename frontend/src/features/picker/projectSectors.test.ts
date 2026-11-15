import { describe, expect, it } from 'vitest'

import { adaptSectorSnapshot } from '../../data/adapters/sectorAdapter'
import { contractFixtures } from '../../data/contracts/contractFixtures'
import { parseContract } from '../../data/contracts/contractValidator'
import { projectSectors } from './projectSectors'

const { sectors } = adaptSectorSnapshot(
  parseContract('sectorRisk', contractFixtures.sectorsNino),
)

describe('dibujo plano de los sectores', () => {
  it('dibuja todos los sectores que llegan, sin asumir cuántos son', () => {
    expect(projectSectors(sectors).shapes).toHaveLength(sectors.length)
    expect(projectSectors(sectors.slice(0, 3)).shapes).toHaveLength(3)
    expect(projectSectors([]).shapes).toEqual([])
  })

  it('mantiene cada sector dentro del dibujo', () => {
    const { shapes, width, height } = projectSectors(sectors)

    for (const shape of shapes) {
      expect(shape.cx).toBeGreaterThan(0)
      expect(shape.cx).toBeLessThan(width)
      expect(shape.cy).toBeGreaterThan(0)
      expect(shape.cy).toBeLessThan(height)
    }
  })

  it('pone el norte arriba: más al norte es más arriba', () => {
    const { shapes } = projectSectors(sectors)
    const byId = new Map(shapes.map((shape) => [shape.id, shape]))
    const sorted = [...sectors].sort(
      (a, b) => b.centroid.lat - a.centroid.lat,
    )
    const northmost = byId.get(sorted[0].id)!
    const southmost = byId.get(sorted[sorted.length - 1].id)!

    expect(northmost.cy).toBeLessThan(southmost.cy)
  })
})
