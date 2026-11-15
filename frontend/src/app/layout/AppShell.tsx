import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { LlamaStanding, Plant } from '../../shared/sprites/Sprites'
import { getPersistentSearch } from '../navigation/persistentSearch'
import { useAppState } from '../providers/appStateContext'
import { writeUrlState } from '../state/urlState'
import { AppHeader } from './AppHeader'
import styles from './AppShell.module.css'

const navigationItems = [
  { label: 'Mi comunidad', path: '/mi-comunidad', picture: <Plant size={2} /> },
  {
    label: 'Preguntar',
    path: '/preguntar',
    picture: <LlamaStanding size={1.9} />,
  },
] as const

export function AppShell() {
  const location = useLocation()
  const { state } = useAppState()
  const persistentSearch = getPersistentSearch(location.search)
  // "Mi comunidad" siempre vuelve al resumen, sin arrastrar un sector.
  const communitySearch = writeUrlState({
    selectedSectorId: null,
    scenario: state.scenario,
  })
  // La barra aparece cuando ya hay comunidad elegida: antes solo hay que elegir.
  const hasCommunity = state.communityId !== null

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#contenido-principal">
        Saltar al contenido
      </a>

      <AppHeader />

      <main className={styles.main} id="contenido-principal" tabIndex={-1}>
        <Outlet />
      </main>

      {hasCommunity ? (
        <nav
          className={`${styles.navigation} no-imprimir`}
          aria-label="Navegación principal"
        >
          <ul className={styles.navigationList}>
            {navigationItems.map((item) => (
              <li key={item.path}>
                <NavLink
                  className={styles.navigationLink}
                  to={{
                    pathname: item.path,
                    search:
                      item.path === '/mi-comunidad'
                        ? communitySearch
                        : persistentSearch,
                  }}
                >
                  <span className={styles.navigationPicture}>
                    {item.picture}
                  </span>
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}
    </div>
  )
}
