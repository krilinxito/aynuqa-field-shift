import {
  useCallback,
  useEffect,
  useMemo,
  useReducer,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from 'react'
import { useLocation, useNavigate } from 'react-router-dom'

import { cacheKeys } from '../../data/cache/cacheKeys'
import { AppStateContext, type AppStateContextValue } from './appStateContext'
import { useDataLayer } from './dataRepositoryContext'
import { appStateReducer, defaultAppState } from '../state/appState'
import { readStored, storageKeys, writeStored } from '../state/deviceStorage'
import { readUrlState, resolveUrlState, writeUrlState } from '../state/urlState'

/**
 * Único lugar que sabe cómo se guarda la selección (URL + celular).
 * Las pantallas solo ven `state`, `actions` y `meta`.
 */
export function AppStateProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { repository, queryClient } = useDataLayer()
  const urlDraft = useMemo(
    () => readUrlState(location.search),
    [location.search],
  )
  const [state, dispatch] = useReducer(appStateReducer, undefined, () => ({
    ...defaultAppState,
    communityId: readStored(storageKeys.community),
    selectedSectorId: urlDraft.selectedSectorId,
    scenario: urlDraft.scenario,
  }))
  const [availableSectorIds, setAvailableSectorIds] = useState<string[]>([])
  const activeSectorsKey = cacheKeys.sectors(urlDraft.scenario)
  const subscribeToQueries = useCallback(
    (listener: () => void) => queryClient.subscribe(listener),
    [queryClient],
  )
  const getSectorsSnapshot = useCallback(
    () => queryClient.getSnapshot(activeSectorsKey),
    [activeSectorsKey, queryClient],
  )
  const sectorsSnapshot = useSyncExternalStore(
    subscribeToQueries,
    getSectorsSnapshot,
    getSectorsSnapshot,
  )

  useEffect(() => {
    const controller = new AbortController()

    void queryClient
      .fetchQuery({
        key: activeSectorsKey,
        scope: 'active-sectors',
        staleTimeMs: 30_000,
        signal: controller.signal,
        queryFn: (signal) => repository.getSectors(urlDraft.scenario, { signal }),
      })
      .then((response) => {
        if (controller.signal.aborted) {
          return
        }

        const sectorIds = response.sectors.map((sector) => sector.id)
        const resolved = resolveUrlState({
          search: location.search,
          availableSectorIds: sectorIds,
        })

        setAvailableSectorIds(sectorIds)
        dispatch({
          type: 'hydrate',
          state: {
            communityId: readStored(storageKeys.community),
            ...resolved,
          },
        })
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [
    activeSectorsKey,
    location.search,
    queryClient,
    repository,
    urlDraft.scenario,
  ])

  const value = useMemo<AppStateContextValue>(
    () => ({
      state,
      actions: {
        selectCommunity: (communityId) => {
          writeStored(storageKeys.community, communityId)
          dispatch({ type: 'select-community', communityId })
          void navigate({
            pathname: '/mi-comunidad',
            search: writeUrlState({
              selectedSectorId: null,
              scenario: state.scenario,
            }),
          })
        },
        openSector: (sectorId) => {
          dispatch({ type: 'select-sector', sectorId })
          void navigate({
            pathname: '/sector',
            search: writeUrlState({
              selectedSectorId: sectorId,
              scenario: state.scenario,
            }),
          })
        },
        selectScenario: (scenario) => {
          dispatch({ type: 'select-scenario', scenario })
          void navigate(
            {
              pathname: location.pathname,
              search: writeUrlState({
                selectedSectorId: state.selectedSectorId,
                scenario,
              }),
            },
            { replace: true },
          )
        },
      },
      meta: {
        availableSectorIds,
        sectorsStatus: sectorsSnapshot.status,
        sectorsError: sectorsSnapshot.error,
      },
    }),
    [
      availableSectorIds,
      location.pathname,
      navigate,
      sectorsSnapshot.error,
      sectorsSnapshot.status,
      state,
    ],
  )

  return <AppStateContext value={value}>{children}</AppStateContext>
}
