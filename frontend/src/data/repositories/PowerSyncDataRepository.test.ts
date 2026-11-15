import type { PowerSyncDatabase } from '@powersync/web'
import { describe, expect, it, vi } from 'vitest'

import { contractFixtures } from '../contracts/contractFixtures'
import { ApiDataRepository } from './ApiDataRepository'
import { PowerSyncDataRepository } from './PowerSyncDataRepository'

function localDatabase(payload: unknown): PowerSyncDatabase {
  return {
    getOptional: vi.fn().mockResolvedValue({ payload: JSON.stringify(payload) }),
  } as unknown as PowerSyncDatabase
}

describe('PowerSyncDataRepository', () => {
  it('lee la última instantánea SQLite sin depender de la red', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockRejectedValue(new Error('offline'))
    const repository = new PowerSyncDataRepository(
      localDatabase(contractFixtures.sectorsNino),
      new ApiDataRepository('https://api.example.test', {
        fetchImplementation: fetchMock,
      }),
    )

    const response = await repository.getSectors('nino')

    expect(response.sectors).toHaveLength(8)
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it('usa HTTP durante el primer arranque si SQLite todavía está vacío', async () => {
    const database = {
      getOptional: vi.fn().mockResolvedValue(null),
    } as unknown as PowerSyncDatabase
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(
      new Response(JSON.stringify(contractFixtures.sectorsNormal), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    )
    const repository = new PowerSyncDataRepository(
      database,
      new ApiDataRepository('https://api.example.test', {
        fetchImplementation: fetchMock,
      }),
    )

    await expect(repository.getSectors('normal')).resolves.toMatchObject({
      scenario: 'normal',
    })
    expect(fetchMock).toHaveBeenCalledOnce()
  })
})
