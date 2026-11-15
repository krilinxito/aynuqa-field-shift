import { describe, expect, it } from 'vitest'

import { MockDataRepository } from './MockDataRepository'
import { FixtureMissingError } from '../transport/errors'
import { contractFixtures } from '../contracts/contractFixtures'
import { parseContract } from '../contracts/contractValidator'

const repository = new MockDataRepository()

describe('MockDataRepository', () => {
  it.each(['nino', 'normal'] as const)(
    'devuelve los ocho sectores del escenario %s',
    async (scenario) => {
      const response = await repository.getSectors(scenario)

      expect(response.scenario).toBe(scenario)
      expect(response.sectors.map((sector) => sector.id)).toEqual([
        'S1',
        'S2',
        'S3',
        'S4',
        'S5',
        'S6',
        'S7',
        'S8',
      ])
    },
  )

  it('conserva precedentes null en el escenario normal', async () => {
    const response = await repository.getSectors('normal')

    expect(response.sectors.every((sector) => sector.twin_precedent === null)).toBe(
      true,
    )
  })

  it('filtra el histórico S1 sin inventar puntos ni reemplazar null', async () => {
    const complete = await repository.getSectorHistory('S1')
    const ranged = await repository.getSectorHistory('S1', {
      from: '2000-01',
      to: '2000-03',
    })

    expect(complete.series).toHaveLength(322)
    expect(complete.series.some((point) => point.ndvi === null)).toBe(true)
    expect(ranged.from).toBe('2000-01')
    expect(ranged.to).toBe('2000-03')
    expect(ranged.series.map((point) => point.date)).toEqual([
      '2000-01',
      '2000-02',
      '2000-03',
    ])
  })

  it.each([
    ['S2', undefined],
    ['S8', undefined],
    ['S1', { from: '1999-12', to: '2000-02' }],
    ['S1', { from: '2026-09', to: '2026-11' }],
  ] as const)('rechaza históricos sin cobertura para %s', async (sectorId, range) => {
    await expect(repository.getSectorHistory(sectorId, range)).rejects.toBeInstanceOf(
      FixtureMissingError,
    )
  })

  it('filtra sensores S1 entre una y 48 horas', async () => {
    const oneHour = await repository.getSectorSensors('S1', 1)
    const full = await repository.getSectorSensors('S1', 48)

    expect(oneHour.readings).toHaveLength(3)
    expect(oneHour.readings.at(-1)?.ts).toBe(full.readings.at(-1)?.ts)
    expect(full.readings).toHaveLength(97)
    expect(full.readings.every((reading) => reading.is_simulated)).toBe(true)
  })

  it.each([
    ['S2', 48],
    ['S8', 1],
    ['S1', 49],
  ] as const)('rechaza sensores sin fixture para %s/%s', async (sectorId, hours) => {
    await expect(repository.getSectorSensors(sectorId, hours)).rejects.toBeInstanceOf(
      FixtureMissingError,
    )
  })

  it('devuelve únicamente el backtest oficial disponible', async () => {
    await expect(repository.getBacktest('2015-16')).resolves.toMatchObject({
      event: '2015-16',
      held_out: true,
    })
    await expect(repository.getBacktest('2023-24')).rejects.toBeInstanceOf(
      FixtureMissingError,
    )
    await expect(repository.getBacktest('2020-22')).rejects.toBeInstanceOf(
      FixtureMissingError,
    )
  })

  it('responde el chat solo para la solicitud oficial exacta', async () => {
    const officialRequest = parseContract(
      'chatRequest',
      contractFixtures.chatRequest,
    )

    await expect(
      repository.sendChat(officialRequest),
    ).resolves.toEqual(contractFixtures.chatResponse)
    await expect(
      repository.sendChat({
        ...officialRequest,
        message: 'Otra pregunta',
      }),
    ).rejects.toBeInstanceOf(FixtureMissingError)
  })

  it('devuelve health sin alterar procedencia', async () => {
    await expect(repository.getHealth()).resolves.toEqual(contractFixtures.health)
  })

  it('respeta una cancelación recibida', async () => {
    const controller = new AbortController()
    controller.abort(new DOMException('Cancelada', 'AbortError'))

    await expect(
      repository.getSectors('nino', { signal: controller.signal }),
    ).rejects.toMatchObject({ name: 'AbortError' })
  })
})
