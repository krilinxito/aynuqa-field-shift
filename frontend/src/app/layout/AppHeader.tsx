import { useOnline } from '../../shared/hooks/useOnline'
import { Chakana, Skyline } from '../../shared/sprites/Sprites'
import { isDemoData } from '../status/demoData'
import { useTextSize } from '../textsize/textSizeContext'
import styles from './AppHeader.module.css'

/** Aviso corto: solo aparece cuando hay algo que la persona debe saber. */
function StatusLine() {
  const isOnline = useOnline()
  const isDemo = isDemoData()

  if (isOnline && !isDemo) {
    return null
  }

  return (
    <p className={styles.status} role="status">
      {!isOnline ? (
        <span>
          <strong>Sin señal.</strong> Se muestran los últimos datos guardados.
        </span>
      ) : null}
      {isDemo ? <span>Datos de demostración</span> : null}
    </p>
  )
}

export function AppHeader() {
  const { state, actions } = useTextSize()
  const isLarge = state.size === 'grande'

  return (
    <header className={styles.header}>
      <Skyline />
      <div className={styles.bar}>
        <p className={styles.brand}>
          <Chakana size={1.7} />
          <span>Aynuqa</span>
        </p>
        <button
          type="button"
          className={`${styles.textSize} no-imprimir`}
          aria-pressed={isLarge}
          onClick={actions.toggle}
        >
          <span aria-hidden="true" className={styles.textSizeIcon}>
            A+
          </span>
          {isLarge ? 'Letra normal' : 'Letra grande'}
        </button>
      </div>
      <StatusLine />
    </header>
  )
}
