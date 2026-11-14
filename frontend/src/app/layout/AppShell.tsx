import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { getPersistentSearch } from '../navigation/persistentSearch'
import { AppHeader } from './AppHeader'
import { NavigationIcon } from './NavigationIcon'
import styles from './AppShell.module.css'

const navigationItems = [
  { icon: 'territory', label: 'Territorio', path: '/territorio' },
  { icon: 'analysis', label: 'Análisis', path: '/analisis' },
  { icon: 'assistant', label: 'Asistente', path: '/asistente' },
  { icon: 'report', label: 'Informe', path: '/informe' },
] as const

export function AppShell() {
  const location = useLocation()
  const persistentSearch = getPersistentSearch(location.search)

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#contenido-principal">
        Saltar al contenido
      </a>

      <AppHeader />

      <nav className={styles.navigation} aria-label="Navegación principal">
        <ul className={styles.navigationList}>
          {navigationItems.map((item) => (
            <li key={item.path}>
              <NavLink
                className={({ isActive }) =>
                  `${styles.navigationLink} ${isActive ? styles.navigationLinkActive : ''}`
                }
                to={{ pathname: item.path, search: persistentSearch }}
              >
                <span className={styles.navigationIcon}>
                  <NavigationIcon name={item.icon} />
                </span>
                <span className={styles.navigationLabel}>{item.label}</span>
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      <main className={styles.main} id="contenido-principal" tabIndex={-1}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <p>Herramienta de apoyo a decisiones comunitarias.</p>
      </footer>
    </div>
  )
}
