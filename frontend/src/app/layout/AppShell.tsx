import { NavLink, Outlet, useLocation } from 'react-router-dom'

import { BrandMark } from '../../shared/components/BrandMark'
import { getPersistentSearch } from '../navigation/persistentSearch'
import styles from './AppShell.module.css'

const navigationItems = [
  { label: 'Territorio', path: '/territorio' },
  { label: 'Análisis', path: '/analisis' },
  { label: 'Asistente', path: '/asistente' },
  { label: 'Informe', path: '/informe' },
] as const

export function AppShell() {
  const location = useLocation()
  const persistentSearch = getPersistentSearch(location.search)

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#contenido-principal">
        Saltar al contenido
      </a>

      <header className={styles.header}>
        <BrandMark />
        <div>
          <p className={styles.locationLabel}>Área piloto</p>
          <p className={styles.locationName}>Pumani · La Paz</p>
        </div>
      </header>

      <nav className={styles.navigation} aria-label="Navegación principal">
        {navigationItems.map((item) => (
          <NavLink
            className={({ isActive }) =>
              `${styles.navigationLink} ${isActive ? styles.navigationLinkActive : ''}`
            }
            key={item.path}
            to={{ pathname: item.path, search: persistentSearch }}
          >
            {item.label}
          </NavLink>
        ))}
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
