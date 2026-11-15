import { UpdateType, type AbstractPowerSyncDatabase } from '@powersync/web'
import { describe, expect, it, vi } from 'vitest'

import { AynuqaPowerSyncConnector } from './connector'

const row = {
  id: '6f1c2b0e-8a4d-4d6b-9c51-2f0e7a3b9d10',
  community_id: 'pumani',
  sector_id: 'S4',
  scenario: 'nino',
  action: 'extend_rest',
  recommended_action: 'extend_rest',
  follows_recommendation: 1,
  note: null,
  decided_at: '2026-11-15T10:30:00-04:00',
}

function tokenResponse() {
  return new Response(
    JSON.stringify({
      token: 'tok',
      endpoint: 'https://sync.example.test',
      expires_at: '2099-01-01T00:00:00Z',
    }),
    { status: 200 },
  )
}

function databaseWith(crud: Array<{ op: UpdateType; table: string; id: string }>) {
  const complete = vi.fn().mockResolvedValue(undefined)
  const database = {
    getNextCrudTransaction: vi.fn().mockResolvedValue({ crud, complete }),
    getOptional: vi.fn().mockResolvedValue(row),
  } as unknown as AbstractPowerSyncDatabase
  return { database, complete }
}

describe('AynuqaPowerSyncConnector.uploadData', () => {
  it('sube la decisión completa con PUT y el token de la app', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response(JSON.stringify(row), { status: 200 }))
    const { database, complete } = databaseWith([
      { op: UpdateType.PATCH, table: 'decisions', id: row.id },
    ])

    await new AynuqaPowerSyncConnector('https://api.example.test/', fetchMock).uploadData(
      database,
    )

    const [url, init] = fetchMock.mock.calls[1]
    expect((url as URL).toString()).toBe(`https://api.example.test/api/decisions/${row.id}`)
    expect(init?.method).toBe('PUT')
    expect(init?.headers).toMatchObject({ Authorization: 'Bearer tok' })
    expect(JSON.parse(init?.body as string)).toMatchObject({
      sector_id: 'S4',
      follows_recommendation: true,
    })
    expect(complete).toHaveBeenCalledOnce()
  })

  it('sin señal deja la decisión en la cola para reintentar', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response('{}', { status: 503 }))
    const { database, complete } = databaseWith([
      { op: UpdateType.PUT, table: 'decisions', id: row.id },
    ])

    await expect(
      new AynuqaPowerSyncConnector('https://api.example.test/', fetchMock).uploadData(
        database,
      ),
    ).rejects.toThrow()
    expect(complete).not.toHaveBeenCalled()
  })

  it('un rechazo del servidor no traba la cola', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValueOnce(tokenResponse())
      .mockResolvedValueOnce(new Response('{}', { status: 422 }))
    vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { database, complete } = databaseWith([
      { op: UpdateType.DELETE, table: 'decisions', id: row.id },
    ])

    await new AynuqaPowerSyncConnector('https://api.example.test/', fetchMock).uploadData(
      database,
    )
    expect(fetchMock.mock.calls[1][1]?.method).toBe('DELETE')
    expect(complete).toHaveBeenCalledOnce()
  })
})
