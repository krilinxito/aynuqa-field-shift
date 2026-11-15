import { Navigate, useLocation } from 'react-router-dom'

import { useAppState } from '../providers/appStateContext'
import { getPersistentSearch } from './persistentSearch'

/**
 * Al abrir la app: quien ya eligió va directo a su sector; quien no,
 * empieza eligiendo su comunidad.
 */
export function RootRedirect() {
  const location = useLocation()
  const { state } = useAppState()
  const pathname = !state.communityId
    ? '/comunidad'
    : state.selectedSectorId
      ? '/mi-sector'
      : '/sector'

  return (
    <Navigate
      replace
      to={{ pathname, search: getPersistentSearch(location.search) }}
    />
  )
}
