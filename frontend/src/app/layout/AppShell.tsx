import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { LlamaStanding, Plant } from '../../shared/sprites/Sprites'
import { useLanguage } from '../i18n/languageContext'
import { getPersistentSearch } from '../navigation/persistentSearch'
import { useAppState } from '../providers/appStateContext'
import { writeUrlState } from '../state/urlState'
import { AppHeader } from './AppHeader'
import styles from './AppShell.module.css'

export function AppShell() {
  const location = useLocation()
  const { state } = useAppState()
  const { t } = useLanguage()
  const persistentSearch = getPersistentSearch(location.search)
  const communitySearch = writeUrlState({
    selectedSectorId: null,
    scenario: state.scenario,
  })
  const hasCommunity = state.communityId !== null

  const navigationItems = [
    {
      label: t.navMyCommunity,
      path: '/mi-comunidad',
      picture: <Plant size={2} />,
    },
    {
      label: t.navAsk,
      path: '/preguntar',
      picture: <LlamaStanding size={1.9} />,
    },
  ] as const

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#contenido-principal">
        {t.skipToContent}
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
