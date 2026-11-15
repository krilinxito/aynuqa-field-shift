import { SecondaryButton } from './Actions'
import styles from './LoadError.module.css'

/** Aviso cuando no se pudieron cargar los datos y no hay nada guardado. */
export function LoadError() {
  return (
    <div className={styles.error} role="alert">
      <h1>No se pudieron cargar los datos</h1>
      <p>
        Puede ser que no haya señal. Cuando vuelva la señal, toque el botón para
        intentar otra vez.
      </p>
      <SecondaryButton onClick={() => window.location.reload()}>
        Intentar otra vez
      </SecondaryButton>
    </div>
  )
}
