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
import { assertDateRange } from '../../data/repositories/inputValidation'
import { AppStateContext, type AppStateContextValue } from './appStateContext'
import { useDataLayer } from './dataRepositoryContext'
import {
  appStateReducer,
  defaultAppState,
  type AppState,
} from '../state/appState'
import {
  readUrlState,
  resolveAppState,
  writeUrlState,
} from '../state/urlState'

const storedSectorKey = 'aynuqa:selected-sector'

function readStoredSector(): string | null {
  try {
    return localStorage.getItem(storedSectorKey)
  } catch {
    return null
  }
}

function storeSector(sectorId: string): void {
  try {
    localStorage.setItem(storedSectorKey, sectorId)
  } catch {
    // La URL sigue siendo la fuente compartible si el almacenamiento no existe.
  }
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const location = useLocation()
  const navigate = useNavigate()
  const { repository, queryClient } = useDataLayer()
  const urlDraft = useMemo(
    () => readUrlState(location.search, location.pathname),
    [location.pathname, location.search],
  )
  const [state, dispatch] = useReducer(appStateReducer, {
    ...defaultAppState,
    ...urlDraft,
  })
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
        signal: controller.signal,
        queryFn: (signal) => repository.getSectors(urlDraft.scenario, { signal }),
      })
      .then((response) => {
        if (controller.signal.aborted) {
          return
        }

        const sectorIds = response.sectors.map((sector) => sector.id)
        const resolved = resolveAppState({
          search: location.search,
          pathname: location.pathname,
          availableSectorIds: sectorIds,
          storedSectorId: readStoredSector(),
        })
        const canonicalSearch = writeUrlState(resolved, location.pathname)

        setAvailableSectorIds(sectorIds)
        dispatch({ type: 'hydrate', state: resolved })

        if (resolved.selectedSectorId) {
          storeSector(resolved.selectedSectorId)
        }

        if (canonicalSearch !== location.search) {
          void navigate(
            { pathname: location.pathname, search: canonicalSearch },
            { replace: true },
          )
        }
      })
      .catch(() => undefined)

    return () => controller.abort()
  }, [
    activeSectorsKey,
    location.pathname,
    location.search,
    navigate,
    queryClient,
    repository,
    urlDraft.scenario,
  ])

  const updateUrl = useCallback(
    (nextState: AppState) => {
      const search = writeUrlState(nextState, location.pathname)
      dispatch({ type: 'hydrate', state: nextState })
      void navigate({ pathname: location.pathname, search }, { replace: true })
    },
    [location.pathname, navigate],
  )

  const value = useMemo<AppStateContextValue>(
    () => ({
      ...state,
      availableSectorIds,
      sectorsStatus: sectorsSnapshot.status,
      sectorsError: sectorsSnapshot.error,
      selectSector: (sectorId) => {
        if (!availableSectorIds.includes(sectorId)) {
          return
        }

        storeSector(sectorId)
        updateUrl({ ...state, selectedSectorId: sectorId })
      },
      selectScenario: (scenario) => updateUrl({ ...state, scenario }),
      setDateRange: (dateRange) => {
        assertDateRange(dateRange ?? undefined)
        updateUrl({ ...state, dateRange })
      },
      setAnalysisSection: (analysisSection) =>
        updateUrl({ ...state, analysisSection }),
    }),
    [
      availableSectorIds,
      sectorsSnapshot.error,
      sectorsSnapshot.status,
      state,
      updateUrl,
    ],
  )

  return (
    <AppStateContext.Provider value={value}>
      {children}
    </AppStateContext.Provider>
  )
}
