import { Navigate, useLocation } from 'react-router-dom'

import { useAppState } from '../providers/appStateContext'
import { getPersistentSearch } from './persistentSearch'

/**
 * Al abrir la app: quien ya eligió va directo a su comunidad; quien no,
 * empieza eligiéndola.
 */
export function RootRedirect() {
  const location = useLocation()
  const { state } = useAppState()
  const pathname = state.communityId ? '/mi-comunidad' : '/comunidad'

  return (
    <Navigate
      replace
      to={{ pathname, search: getPersistentSearch(location.search) }}
    />
  )
}
