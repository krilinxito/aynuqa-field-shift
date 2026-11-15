import { ApiDataRepository } from '../repositories/ApiDataRepository'
import type { DataRepository } from '../repositories/DataRepository'
import { PowerSyncDataRepository } from '../repositories/PowerSyncDataRepository'
import { getPowerSyncDatabase } from './database'

/** Punto de entrada del módulo pesado de PowerSync: se importa de forma diferida. */
export function createPowerSyncRepository(
  api: ApiDataRepository,
  apiBaseUrl: string,
  fetchImplementation?: typeof fetch,
  endpointOverride?: string,
): DataRepository {
  return new PowerSyncDataRepository(
    getPowerSyncDatabase(apiBaseUrl, fetchImplementation, endpointOverride),
    api,
  )
}
