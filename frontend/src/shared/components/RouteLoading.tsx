import { LlamaWalking } from '../sprites/Sprites'
import styles from './RouteLoading.module.css'

export function RouteLoading() {
  return (
    <div className={styles.loading} role="status" aria-live="polite">
      <LlamaWalking />
      <p>Cargando…</p>
    </div>
  )
}
