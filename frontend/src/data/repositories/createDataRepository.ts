import { ConfigurationError } from '../transport/errors'
import { ApiDataRepository } from './ApiDataRepository'
import type { DataRepository } from './DataRepository'
import { MockDataRepository } from './MockDataRepository'
import { LazyPowerSyncRepository } from './LazyPowerSyncRepository'

export interface DataEnvironment {
  VITE_DATA_MODE?: string
  VITE_API_BASE_URL?: string
  VITE_POWERSYNC_ENABLED?: string
  /** Opcional. "/powersync" = el mismo sitio que sirve la app (túnel). */
  VITE_POWERSYNC_URL?: string
}

export interface RepositoryDependencies {
  fetchImplementation?: typeof fetch
  timeoutMs?: number
}

export function createDataRepository(
  environment: DataEnvironment = import.meta.env,
  dependencies: RepositoryDependencies = {},
): DataRepository {
  const mode = environment.VITE_DATA_MODE ?? 'mock'

  if (mode === 'mock') {
    return new MockDataRepository()
  }

  if (mode === 'api') {
    const baseUrl = environment.VITE_API_BASE_URL?.trim()

    if (!baseUrl) {
      throw new ConfigurationError(
        'VITE_API_BASE_URL es obligatoria cuando VITE_DATA_MODE=api.',
      )
    }

    try {
      // Una ruta como "/" significa "el mismo sitio que sirve la app":
      // así la dirección pública puede cambiar sin recompilar.
      const absoluteUrl = baseUrl.startsWith('/')
        ? new URL(baseUrl, window.location.origin).toString()
        : baseUrl

      const api = new ApiDataRepository(absoluteUrl, dependencies)
      if (environment.VITE_POWERSYNC_ENABLED !== 'true') {
        return api
      }

      const syncUrl = environment.VITE_POWERSYNC_URL?.trim()
      const powersyncEndpoint = syncUrl
        ? new URL(syncUrl, window.location.origin).toString().replace(/\/+$/, '')
        : undefined

      // PowerSync va en un archivo aparte: no frena el primer dibujo.
      return new LazyPowerSyncRepository(api, () =>
        import('../powersync/loadPowerSync').then(({ createPowerSyncRepository }) =>
          createPowerSyncRepository(
            api,
            absoluteUrl,
            dependencies.fetchImplementation,
            powersyncEndpoint,
          ),
        ),
      )
    } catch (error) {
      throw new ConfigurationError(
        'VITE_API_BASE_URL debe ser una URL HTTP o HTTPS válida.',
        { cause: error },
      )
    }
  }

  throw new ConfigurationError(
    `VITE_DATA_MODE=${mode} no es válido. Usa mock o api.`,
  )
}
