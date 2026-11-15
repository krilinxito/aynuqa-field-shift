import { PrimaryLink } from '../shared/components/Actions'
import { LlamaResting } from '../shared/sprites/Sprites'
import styles from './routes.module.css'

export function NotFoundRoute() {
  return (
    <div className={styles.page}>
      <LlamaResting />
      <h1>Esta página no existe</h1>
      <p>Puede volver al inicio con el botón.</p>
      <PrimaryLink to="/">Volver al inicio</PrimaryLink>
    </div>
  )
}
