import styles from './BrandMark.module.css'

export function BrandMark() {
  return (
    <div className={styles.brand} aria-label="Aynuqa Field Shift">
      <span className={styles.mark} aria-hidden="true" />
      <span className={styles.name}>Aynuqa</span>
    </div>
  )
}
