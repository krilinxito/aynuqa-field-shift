import { afterEach, describe, expect, it, vi } from 'vitest'

import { contractFixtures } from '../contracts/contractFixtures'
import { parseContract } from '../contracts/contractValidator'
import {
  ApiError,
  ContractError,
  TimeoutError,
} from '../transport/errors'
import { ApiDataRepository } from './ApiDataRepository'

function jsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

function getRequestUrl(input: RequestInfo | URL | undefined): string {
  if (input instanceof URL) {
    return input.href
  }

  if (typeof input === 'string') {
    return input
  }

  return input?.url ?? ''
}

function createRepository(response: Response) {
  const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(response)

  return {
    fetchMock,
    repository: new ApiDataRepository('https://api.example.test/base', {
      fetchImplementation: fetchMock,
    }),
  }
}

afterEach(() => {
  vi.useRealTimers()
})

describe('ApiDataRepository', () => {
  it('construye la URL de sectores y codifica el escenario', async () => {
    const { repository, fetchMock } = createRepository(
      jsonResponse(contractFixtures.sectorsNino),
    )

    await repository.getSectors('nino')

    const url = getRequestUrl(fetchMock.mock.calls[0]?.[0])
    expect(url).toBe(
      'https://api.example.test/base/api/sectors?scenario=nino',
    )
  })

  it('envía sector, rango e intervalo solo como parámetros', async () => {
    const historySetup = createRepository(
      jsonResponse({
        ...contractFixtures.historyS1,
        from: '2020-01',
        to: '2020-02',
        series: contractFixtures.historyS1.series.filter(
          (point) => point.date >= '2020-01' && point.date <= '2020-02',
        ),
      }),
    )

    await historySetup.repository.getSectorHistory('S1', {
      from: '2020-01',
      to: '2020-02',
    })
    expect(getRequestUrl(historySetup.fetchMock.mock.calls[0]?.[0])).toBe(
      'https://api.example.test/base/api/sectors/S1/history?from=2020-01&to=2020-02',
    )

    const sensorsSetup = createRepository(
      jsonResponse({ ...contractFixtures.sensorsS1, hours: 24 }),
    )
    await sensorsSetup.repository.getSectorSensors('S1', 24)
    expect(getRequestUrl(sensorsSetup.fetchMock.mock.calls[0]?.[0])).toBe(
      'https://api.example.test/base/api/sectors/S1/sensors?hours=24',
    )
  })

  it('serializa el cuerpo POST del chat sin opciones internas', async () => {
    const { repository, fetchMock } = createRepository(
      jsonResponse(contractFixtures.chatResponse),
    )
    const controller = new AbortController()
    const request = parseContract('chatRequest', contractFixtures.chatRequest)

    await repository.sendChat(request, {
      signal: controller.signal,
      timeoutMs: 500,
    })

    const init = fetchMock.mock.calls[0]?.[1]
    expect(init?.method).toBe('POST')
    expect(init?.body).toBe(JSON.stringify(request))
    expect(init?.headers).not.toHaveProperty('X-Admin-Token')
  })

  it.each([
    [404, 'sector_not_found'],
    [422, 'invalid_request'],
    [502, 'llm_unavailable'],
    [401, 'unauthorized'],
  ])('expone el error HTTP %s/%s tipado', async (status, code) => {
    const { repository } = createRepository(
      jsonResponse(
        { error: { code, message: 'Mensaje simple.' } },
        status,
      ),
    )

    await expect(repository.getHealth()).rejects.toMatchObject<
      Partial<ApiError>
    >({ status, code, message: 'Mensaje simple.' })
  })

  it('rechaza respuestas no JSON o malformadas', async () => {
    const fetchMock = vi
      .fn<typeof fetch>()
      .mockResolvedValue(new Response('<html>Error</html>', { status: 200 }))
    const repository = new ApiDataRepository('https://api.example.test', {
      fetchImplementation: fetchMock,
    })

    await expect(repository.getHealth()).rejects.toBeInstanceOf(ContractError)
  })

  it('rechaza respuestas incompatibles con el contrato', async () => {
    const { repository } = createRepository(
      jsonResponse({ ...contractFixtures.health, unexpected: true }),
    )

    await expect(repository.getHealth()).rejects.toBeInstanceOf(ContractError)
  })

  it('verifica que la respuesta corresponda al escenario solicitado', async () => {
    const { repository } = createRepository(
      jsonResponse(contractFixtures.sectorsNormal),
    )

    await expect(repository.getSectors('nino')).rejects.toBeInstanceOf(
      ContractError,
    )
  })

  it('verifica sector, horas y evento solicitados', async () => {
    const historySetup = createRepository(
      jsonResponse({ ...contractFixtures.historyS1, sector_id: 'S2' }),
    )
    await expect(
      historySetup.repository.getSectorHistory('S1'),
    ).rejects.toBeInstanceOf(ContractError)

    const sensorsSetup = createRepository(
      jsonResponse({ ...contractFixtures.sensorsS1, hours: 47 }),
    )
    await expect(
      sensorsSetup.repository.getSectorSensors('S1', 48),
    ).rejects.toBeInstanceOf(ContractError)

    const backtestSetup = createRepository(
      jsonResponse({ ...contractFixtures.backtest2015, event: '2023-24' }),
    )
    await expect(
      backtestSetup.repository.getBacktest('2015-16'),
    ).rejects.toBeInstanceOf(ContractError)
  })

  it('aplica timeout sin confundirlo con cancelación externa', async () => {
    vi.useFakeTimers()
    const fetchMock: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        )
      })
    const repository = new ApiDataRepository('https://api.example.test', {
      fetchImplementation: fetchMock,
    })
    const request = repository.getHealth({ timeoutMs: 25 })
    const expectation = expect(request).rejects.toBeInstanceOf(TimeoutError)

    await vi.advanceTimersByTimeAsync(25)
    await expectation
  })

  it('propaga la cancelación de AbortSignal', async () => {
    const fetchMock: typeof fetch = (_input, init) =>
      new Promise((_resolve, reject) => {
        init?.signal?.addEventListener('abort', () =>
          reject(new DOMException('Aborted', 'AbortError')),
        )
      })
    const repository = new ApiDataRepository('https://api.example.test', {
      fetchImplementation: fetchMock,
    })
    const controller = new AbortController()
    const request = repository.getHealth({ signal: controller.signal })
    controller.abort(new DOMException('Cancelada', 'AbortError'))

    await expect(request).rejects.toMatchObject({ name: 'AbortError' })
  })
})
