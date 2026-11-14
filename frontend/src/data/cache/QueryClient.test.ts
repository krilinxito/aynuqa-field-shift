import { describe, expect, it, vi } from 'vitest'

import { QueryClient } from './QueryClient'

describe('QueryClient', () => {
  it('deduplica solicitudes simultáneas por clave', async () => {
    const client = new QueryClient()
    let resolveRequest: ((value: string) => void) | undefined
    const queryFn = vi.fn(
      () =>
        new Promise<string>((resolve) => {
          resolveRequest = resolve
        }),
    )

    const first = client.fetchQuery({ key: 'sectors:nino', queryFn })
    const second = client.fetchQuery({ key: 'sectors:nino', queryFn })
    resolveRequest?.('datos')

    await expect(first).resolves.toBe('datos')
    await expect(second).resolves.toBe('datos')
    expect(queryFn).toHaveBeenCalledTimes(1)
  })

  it('conserva el último dato válido cuando una actualización falla', async () => {
    const client = new QueryClient()
    await client.fetchQuery({
      key: 'history:S1',
      queryFn: () => Promise.resolve('válido'),
    })

    await expect(
      client.fetchQuery({
        key: 'history:S1',
        staleTimeMs: -1,
        queryFn: () => Promise.reject(new Error('contrato inválido')),
      }),
    ).rejects.toThrow('contrato inválido')

    expect(client.getSnapshot<string>('history:S1')).toMatchObject({
      status: 'error',
      data: 'válido',
    })
  })

  it('cancela una consulta obsoleta y evita que reemplace la activa', async () => {
    const client = new QueryClient()
    let resolveOld: ((value: string) => void) | undefined
    const oldRequest = client.fetchQuery({
      key: 'sectors:nino',
      scope: 'active-sectors',
      queryFn: (signal) =>
        new Promise<string>((resolve) => {
          signal.addEventListener('abort', () => resolve('tardía'))
          resolveOld = resolve
        }),
    })
    const currentRequest = client.fetchQuery({
      key: 'sectors:normal',
      scope: 'active-sectors',
      queryFn: () => Promise.resolve('actual'),
    })

    resolveOld?.('tardía')
    await expect(oldRequest).rejects.toMatchObject({ name: 'AbortError' })
    await expect(currentRequest).resolves.toBe('actual')
    expect(client.getSnapshot<string>('sectors:normal')).toMatchObject({
      status: 'success',
      data: 'actual',
    })
    expect(client.getSnapshot<string>('sectors:nino').status).not.toBe('success')
  })
})
