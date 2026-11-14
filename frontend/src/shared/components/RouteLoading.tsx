import styles from './RouteLoading.module.css'

export function RouteLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <span className={styles.line} aria-hidden="true" />
      <p>Cargando sección…</p>
    </div>
  )
}
