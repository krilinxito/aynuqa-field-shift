import { BrandMark } from '../../shared/components/BrandMark'
import { useSystemStatus } from '../status/useSystemStatus'
import styles from './AppHeader.module.css'

export function AppHeader() {
  const status = useSystemStatus()

  return (
    <header className={styles.header}>
      <div className={styles.identity}>
        <BrandMark />
        <div className={styles.location}>
          <p className={styles.locationLabel}>Área piloto</p>
          <p className={styles.locationName}>Pumani · La Paz</p>
        </div>
      </div>

      <div
        className={`${styles.systemStatus} ${styles[status.tone]}`}
        role="status"
        aria-live="polite"
        aria-atomic="true"
      >
        <p className={styles.primaryStatus}>{status.primaryLabel}</p>
        {status.secondaryLabel ? (
          <p className={styles.secondaryStatus}>{status.secondaryLabel}</p>
        ) : null}
        <p className={styles.updateStatus}>
          {status.updatedAt ? (
            <time dateTime={status.updatedAt}>{status.updateLabel}</time>
          ) : (
            status.updateLabel
          )}
        </p>
      </div>
    </header>
  )
}
