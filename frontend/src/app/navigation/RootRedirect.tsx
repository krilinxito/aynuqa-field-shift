import { Navigate, useLocation } from 'react-router-dom'

import { getPersistentSearch } from './persistentSearch'

/**
 * Al abrir la app se entra directo a la comunidad con datos. Cambiarla es
 * opcional (desde Ajustes).
 */
export function RootRedirect() {
  const location = useLocation()
  const pathname = '/mi-comunidad'

  return (
    <Navigate
      replace
      to={{ pathname, search: getPersistentSearch(location.search) }}
    />
  )
}
