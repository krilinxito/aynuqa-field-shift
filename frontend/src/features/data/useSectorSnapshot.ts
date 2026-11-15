import { useCallback, useEffect, useMemo, useSyncExternalStore } from 'react'

import { useDataLayer } from '../../app/providers/dataRepositoryContext'
import { adaptSectorSnapshot } from '../../data/adapters/sectorAdapter'
import { cacheKeys } from '../../data/cache/cacheKeys'
import type { QueryStatus } from '../../data/cache/QueryClient'
import type { SectorRiskResponse } from '../../data/contracts/generated'
import type { Scenario } from '../../data/repositories/DataRepository'
import type { SectorSnapshotViewModel } from '../../domain/presentationModels'

export interface SectorSnapshotResult {
  status: QueryStatus
  snapshot: SectorSnapshotViewModel | null
}

/** Zona y sectores de un escenario, ya listos para mostrar. */
export function useSectorSnapshot(scenario: Scenario): SectorSnapshotResult {
  const { repository, queryClient } = useDataLayer()
  const key = cacheKeys.sectors(scenario)
  const subscribe = useCallback(
    (listener: () => void) => queryClient.subscribe(listener),
    [queryClient],
  )
  const getSnapshot = useCallback(
    () => queryClient.getSnapshot<SectorRiskResponse>(key),
    [key, queryClient],
  )
  const query = useSyncExternalStore(subscribe, getSnapshot, getSnapshot)

  useEffect(() => {
    void queryClient
      .fetchQuery({
        key,
        staleTimeMs: 30_000,
        queryFn: (signal) => repository.getSectors(scenario, { signal }),
      })
      .catch(() => undefined)
  }, [key, queryClient, repository, scenario])

  const snapshot = useMemo(
    () => (query.data ? adaptSectorSnapshot(query.data) : null),
    [query.data],
  )

  return { status: query.status, snapshot }
}
