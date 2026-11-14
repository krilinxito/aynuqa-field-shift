import { Navigate, useLocation } from 'react-router-dom'

import { getPersistentSearch } from './persistentSearch'

export function RootRedirect() {
  const location = useLocation()

  return (
    <Navigate
      replace
      to={{
        pathname: '/territorio',
        search: getPersistentSearch(location.search),
      }}
    />
  )
}
