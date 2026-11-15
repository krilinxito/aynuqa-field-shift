import { parseContract } from '../contracts/contractValidator'
import { ApiError, ContractError, NetworkError, TimeoutError } from './errors'

export type QueryValue = string | number | undefined

export interface HttpRequest {
  path: string
  method?: 'GET' | 'POST'
  query?: Record<string, QueryValue>
  body?: unknown
  signal?: AbortSignal
  timeoutMs?: number
}

export interface HttpClientOptions {
  fetchImplementation?: typeof fetch
  timeoutMs?: number
}

export class HttpClient {
  readonly #baseUrl: URL
  readonly #fetch: typeof fetch
  readonly #defaultTimeoutMs: number

  constructor(baseUrl: string, options: HttpClientOptions = {}) {
    this.#baseUrl = new URL(`${baseUrl.replace(/\/+$/, '')}/`)

    if (!['http:', 'https:'].includes(this.#baseUrl.protocol)) {
      throw new TypeError('La URL base debe utilizar HTTP o HTTPS.')
    }

    // En el navegador `fetch` exige llamarse sobre `window`: si se guarda
    // suelto y se llama como método de esta clase falla con "Illegal invocation".
    this.#fetch =
      options.fetchImplementation ?? ((input, init) => fetch(input, init))
    this.#defaultTimeoutMs = options.timeoutMs ?? 10_000
  }

  async request(request: HttpRequest): Promise<unknown> {
    const url = new URL(request.path.replace(/^\/+/, ''), this.#baseUrl)

    for (const [key, value] of Object.entries(request.query ?? {})) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value))
      }
    }

    const controller = new AbortController()
    const timeoutMs = request.timeoutMs ?? this.#defaultTimeoutMs
    let didTimeout = false
    const abortFromCaller = () => controller.abort(request.signal?.reason)
    request.signal?.addEventListener('abort', abortFromCaller, { once: true })

    if (request.signal?.aborted) {
      abortFromCaller()
    }

    const timeoutId = globalThis.setTimeout(() => {
      didTimeout = true
      controller.abort()
    }, timeoutMs)

    try {
      const response = await this.#fetch(url, {
        method: request.method ?? 'GET',
        headers:
          request.body === undefined
            ? { Accept: 'application/json' }
            : {
                Accept: 'application/json',
                'Content-Type': 'application/json',
              },
        body:
          request.body === undefined ? undefined : JSON.stringify(request.body),
        signal: controller.signal,
      })
      const payload = await readJson(response)

      if (!response.ok) {
        const errorResponse = parseContract('apiError', payload)
        throw new ApiError(
          response.status,
          errorResponse.error.code,
          errorResponse.error.message,
        )
      }

      return payload
    } catch (error) {
      if (didTimeout) {
        throw new TimeoutError(timeoutMs, { cause: error })
      }

      if (request.signal?.aborted) {
        throw request.signal.reason ?? new DOMException('Solicitud cancelada.', 'AbortError')
      }

      if (
        error instanceof ApiError ||
        error instanceof ContractError ||
        error instanceof TimeoutError
      ) {
        throw error
      }

      throw new NetworkError({ cause: error })
    } finally {
      globalThis.clearTimeout(timeoutId)
      request.signal?.removeEventListener('abort', abortFromCaller)
    }
  }
}

async function readJson(response: Response): Promise<unknown> {
  const text = await response.text()

  try {
    return JSON.parse(text) as unknown
  } catch (error) {
    throw new ContractError('json', null, { cause: error })
  }
}
