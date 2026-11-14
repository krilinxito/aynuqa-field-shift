import { Link, useLocation } from 'react-router-dom'

import { getPersistentSearch } from '../app/navigation/persistentSearch'
import { SectionPlaceholder } from '../shared/components/SectionPlaceholder'

export function NotFoundRoute() {
  const location = useLocation()

  return (
    <>
      <SectionPlaceholder
        eyebrow="Error 404"
        title="Página no encontrada"
        description="La dirección solicitada no pertenece a esta aplicación."
      />
      <p>
        <Link
          to={{
            pathname: '/territorio',
            search: getPersistentSearch(location.search),
          }}
        >
          Volver al territorio
        </Link>
      </p>
    </>
  )
}
