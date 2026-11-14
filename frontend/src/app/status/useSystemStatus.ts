import { useCallback, useEffect, useSyncExternalStore } from 'react'

import { cacheKeys } from '../../data/cache/cacheKeys'
import type { HealthResponse } from '../../data/contracts/generated'
import { useDataLayer } from '../providers/dataRepositoryContext'
import { getSystemStatus, resolveDataMode } from './systemStatus'

function subscribeToConnectivity(listener: () => void): () => void {
  window.addEventListener('online', listener)
  window.addEventListener('offline', listener)

  return () => {
    window.removeEventListener('online', listener)
    window.removeEventListener('offline', listener)
  }
}

function getOnlineSnapshot(): boolean {
  return navigator.onLine
}

export function useSystemStatus() {
  const { repository, queryClient } = useDataLayer()
  const healthKey = cacheKeys.health()
  const dataMode = resolveDataMode(import.meta.env.VITE_DATA_MODE)
  const isOnline = useSyncExternalStore(
    subscribeToConnectivity,
    getOnlineSnapshot,
    () => true,
  )
  const subscribeToQueries = useCallback(
    (listener: () => void) => queryClient.subscribe(listener),
    [queryClient],
  )
  const getHealthSnapshot = useCallback(
    () => queryClient.getSnapshot<HealthResponse>(healthKey),
    [healthKey, queryClient],
  )
  const healthSnapshot = useSyncExternalStore(
    subscribeToQueries,
    getHealthSnapshot,
    getHealthSnapshot,
  )

  useEffect(() => {
    void queryClient
      .fetchQuery({
        key: healthKey,
        scope: 'app-health',
        staleTimeMs: 60_000,
        queryFn: (signal) => repository.getHealth({ signal }),
      })
      .catch(() => undefined)
  }, [healthKey, queryClient, repository])

  return getSystemStatus({
    dataMode,
    isOnline,
    healthStatus: healthSnapshot.status,
    health: healthSnapshot.data,
  })
}
