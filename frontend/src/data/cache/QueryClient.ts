export type QueryStatus = 'idle' | 'loading' | 'success' | 'stale' | 'error'

export interface QuerySnapshot<T> {
  status: QueryStatus
  data?: T
  error?: unknown
  updatedAt?: number
}

export interface FetchQueryOptions<T> {
  key: string
  scope?: string
  staleTimeMs?: number
  signal?: AbortSignal
  queryFn: (signal: AbortSignal) => Promise<T>
}

const idleQuerySnapshot: QuerySnapshot<never> = { status: 'idle' }

interface QueryEntry<T> extends QuerySnapshot<T> {
  promise?: Promise<T>
}

interface ActiveScope {
  key: string
  generation: number
  controller: AbortController
}

type Listener = () => void

export class QueryClient {
  readonly #cache = new Map<string, QueryEntry<unknown>>()
  readonly #activeScopes = new Map<string, ActiveScope>()
  readonly #listeners = new Set<Listener>()
  #generation = 0

  getSnapshot<T>(key: string): QuerySnapshot<T> {
    const entry = this.#cache.get(key) as QueryEntry<T> | undefined

    if (!entry) {
      return idleQuerySnapshot
    }

    return entry
  }

  subscribe(listener: Listener): () => void {
    this.#listeners.add(listener)
    return () => this.#listeners.delete(listener)
  }

  async fetchQuery<T>(options: FetchQueryOptions<T>): Promise<T> {
    const existing = this.#cache.get(options.key) as QueryEntry<T> | undefined
    const staleTimeMs = options.staleTimeMs ?? 0

    if (
      existing?.data !== undefined &&
      existing.updatedAt !== undefined &&
      Date.now() - existing.updatedAt <= staleTimeMs
    ) {
      return existing.data
    }

    if (existing?.promise) {
      return existing.promise
    }

    const controller = new AbortController()
    const generation = ++this.#generation
    const scope = options.scope

    if (scope) {
      const previous = this.#activeScopes.get(scope)

      if (previous && previous.key !== options.key) {
        previous.controller.abort(
          new DOMException('Solicitud reemplazada.', 'AbortError'),
        )
      }

      this.#activeScopes.set(scope, {
        key: options.key,
        generation,
        controller,
      })
    }

    const abortFromCaller = () => controller.abort(options.signal?.reason)
    options.signal?.addEventListener('abort', abortFromCaller, { once: true })

    if (options.signal?.aborted) {
      abortFromCaller()
    }

    const entry: QueryEntry<T> = {
      status: existing?.data === undefined ? 'loading' : 'stale',
      data: existing?.data,
      updatedAt: existing?.updatedAt,
    }
    const promise = options
      .queryFn(controller.signal)
      .then((data) => {
        if (controller.signal.aborted) {
          throw (
            controller.signal.reason ??
            new DOMException('Solicitud cancelada.', 'AbortError')
          )
        }

        if (this.#isCurrent(scope, options.key, generation)) {
          this.#cache.set(options.key, {
            status: 'success',
            data,
            updatedAt: Date.now(),
          })
          this.#notify()
        }

        return data
      })
      .catch((error: unknown) => {
        if (this.#isCurrent(scope, options.key, generation)) {
          this.#cache.set(options.key, {
            status: 'error',
            data: existing?.data,
            updatedAt: existing?.updatedAt,
            error,
          })
          this.#notify()
        }

        throw error
      })
      .finally(() => {
        options.signal?.removeEventListener('abort', abortFromCaller)
        const active = scope ? this.#activeScopes.get(scope) : undefined

        if (scope && active?.generation === generation) {
          this.#activeScopes.delete(scope)
        }
      })

    entry.promise = promise
    this.#cache.set(options.key, entry)
    this.#notify()

    return promise
  }

  cancelScope(scope: string): void {
    this.#activeScopes.get(scope)?.controller.abort(
      new DOMException('Solicitud cancelada.', 'AbortError'),
    )
    this.#activeScopes.delete(scope)
  }

  invalidate(key: string): void {
    const entry = this.#cache.get(key)

    if (entry?.data !== undefined) {
      entry.status = 'stale'
      this.#notify()
    }
  }

  clear(): void {
    for (const active of this.#activeScopes.values()) {
      active.controller.abort()
    }

    this.#activeScopes.clear()
    this.#cache.clear()
    this.#notify()
  }

  #isCurrent(scope: string | undefined, key: string, generation: number) {
    if (!scope) {
      return true
    }

    const active = this.#activeScopes.get(scope)
    return active?.key === key && active.generation === generation
  }

  #notify(): void {
    for (const listener of this.#listeners) {
      listener()
    }
  }
}
