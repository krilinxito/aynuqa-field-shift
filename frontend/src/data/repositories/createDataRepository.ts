import { ConfigurationError } from '../transport/errors'
import { ApiDataRepository } from './ApiDataRepository'
import type { DataRepository } from './DataRepository'
import { MockDataRepository } from './MockDataRepository'

export interface DataEnvironment {
  VITE_DATA_MODE?: string
  VITE_API_BASE_URL?: string
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
      return new ApiDataRepository(baseUrl, dependencies)
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
