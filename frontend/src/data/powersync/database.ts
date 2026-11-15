import { PowerSyncDatabase } from '@powersync/web'

import { AynuqaPowerSyncConnector } from './connector'
import { AppSchema } from './schema'
import { updateLocalSyncStatus } from './syncStatus'

let database: PowerSyncDatabase | undefined

export function getPowerSyncDatabase(
  apiBaseUrl: string,
  fetchImplementation?: typeof fetch,
  endpointOverride?: string,
): PowerSyncDatabase {
  if (database) return database

  database = new PowerSyncDatabase({
    schema: AppSchema,
    database: {
      dbFilename: 'aynuqa-community-v1.db',
      vfs: 'auto',
      enableMultiTabs: true,
    },
  })

  database.registerListener({
    statusChanged: (status) => {
      updateLocalSyncStatus({
        enabled: true,
        connected: status.connected,
        syncing: status.connecting || status.downloading || status.uploading,
        hasSynced: status.hasSynced ?? false,
        lastSyncedAt: status.lastSyncedAt ?? null,
        error: status.downloadError?.message ?? status.uploadError?.message ?? null,
      })
    },
  })

  updateLocalSyncStatus({
    enabled: true,
    connected: false,
    syncing: true,
    hasSynced: database.currentStatus.hasSynced ?? false,
    lastSyncedAt: database.currentStatus.lastSyncedAt ?? null,
    error: null,
  })

  void database.connect(new AynuqaPowerSyncConnector(apiBaseUrl, fetchImplementation, endpointOverride))
  return database
}
