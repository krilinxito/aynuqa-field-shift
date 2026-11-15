import { useAppState } from '../../app/providers/appStateContext'
import type { Scenario } from '../../data/repositories/DataRepository'
import styles from './ScenarioSwitch.module.css'

const options: ReadonlyArray<{ label: string; value: Scenario }> = [
  { label: 'Hoy, con El Niño', value: 'nino' },
  { label: 'Si fuera un año normal', value: 'normal' },
]

/**
 * Compara lo que pasa hoy (El Niño, el estado real) con un año normal.
 * Cuando se mira el año normal, lo dice con claridad.
 */
export function ScenarioSwitch() {
  const { state, actions } = useAppState()

  return (
    <div className="no-imprimir">
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>Ver el consejo para:</legend>
        <div className={styles.options}>
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              className={styles.option}
              aria-pressed={state.scenario === option.value}
              onClick={() => actions.selectScenario(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </fieldset>
      {state.scenario === 'normal' ? (
        <p className={styles.comparison} role="status">
          <strong>Esto es una comparación.</strong> No es lo que pasa hoy: hoy
          hay El Niño.
        </p>
      ) : null}
    </div>
  )
}
