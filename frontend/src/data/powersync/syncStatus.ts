import { useSyncExternalStore } from 'react'

export interface LocalSyncStatus {
  enabled: boolean
  connected: boolean
  syncing: boolean
  hasSynced: boolean
  lastSyncedAt: Date | null
  error: string | null
}
const initialStatus: LocalSyncStatus = {
  enabled: false,
  connected: false,
  syncing: false,
  hasSynced: false,
  lastSyncedAt: null,
  error: null,
}

let currentStatus = initialStatus
const listeners = new Set<() => void>()

export function updateLocalSyncStatus(status: LocalSyncStatus): void {
  currentStatus = status
  for (const listener of listeners) listener()
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useLocalSyncStatus(): LocalSyncStatus {
  return useSyncExternalStore(subscribe, () => currentStatus, () => initialStatus)
}
