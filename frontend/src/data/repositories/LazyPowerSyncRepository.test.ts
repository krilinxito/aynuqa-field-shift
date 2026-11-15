import { describe, expect, it, vi } from 'vitest'

import { contractFixtures } from '../contracts/contractFixtures'
import { ApiDataRepository } from './ApiDataRepository'
import type { DataRepository } from './DataRepository'
import { LazyPowerSyncRepository } from './LazyPowerSyncRepository'

function apiReturning(body: unknown) {
  const fetchMock = vi.fn<typeof fetch>().mockImplementation(() =>
    Promise.resolve(
      new Response(JSON.stringify(body), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ),
  )
  return {
    fetchMock,
    api: new ApiDataRepository('https://api.example.test', { fetchImplementation: fetchMock }),
  }
}

describe('LazyPowerSyncRepository', () => {
  it('mientras PowerSync no llega, lee de la API sin esperarlo', async () => {
    const { api, fetchMock } = apiReturning(contractFixtures.sectorsNino)
    const load = vi.fn(() => new Promise<DataRepository>(() => undefined))
    const repository = new LazyPowerSyncRepository(api, load)

    await expect(repository.getSectors('nino')).resolves.toMatchObject({ scenario: 'nino' })
    expect(fetchMock).toHaveBeenCalledOnce()
    // No compite por la señal en el primer dibujo.
    expect(load).not.toHaveBeenCalled()
  })

  it('con mala señal usa lo guardado en el celular', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error('sin señal'))
    const api = new ApiDataRepository('https://api.example.test', { fetchImplementation: fetchMock })
    const local = {
      getSectors: vi.fn().mockResolvedValue(contractFixtures.sectorsNino),
    } as unknown as DataRepository
    const repository = new LazyPowerSyncRepository(api, () => Promise.resolve(local))

    await expect(repository.getSectors('nino')).resolves.toMatchObject({ scenario: 'nino' })
  })

  it('ya cargado, lee lo guardado en el celular y no llama a la API', async () => {
    const { api, fetchMock } = apiReturning({})
    const local = {
      getSectors: vi.fn().mockResolvedValue(contractFixtures.sectorsNormal),
    } as unknown as DataRepository
    const repository = new LazyPowerSyncRepository(api, () => Promise.resolve(local))
    await repository.preload()

    await expect(repository.getSectors('normal')).resolves.toMatchObject({ scenario: 'normal' })
    await expect(repository.getSectors('normal')).resolves.toMatchObject({ scenario: 'normal' })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('las decisiones siempre se guardan en PowerSync', async () => {
    const { api } = apiReturning({})
    const saveDecision = vi.fn().mockResolvedValue(undefined)
    const repository = new LazyPowerSyncRepository(api, () =>
      Promise.resolve({ saveDecision } as unknown as DataRepository),
    )
    const decision = JSON.parse('{"id":"x"}') as Parameters<DataRepository['saveDecision']>[0]

    await repository.saveDecision(decision)
    expect(saveDecision).toHaveBeenCalledWith(decision, undefined)
  })
})
