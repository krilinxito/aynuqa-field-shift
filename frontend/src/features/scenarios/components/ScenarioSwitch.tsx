import { useAppState } from '../../../app/providers/appStateContext'
import type { Scenario } from '../../../data/repositories/DataRepository'
import styles from './ScenarioSwitch.module.css'

const options: ReadonlyArray<{ label: string; value: Scenario }> = [
  { label: 'El Niño actual', value: 'nino' },
  { label: 'Año normal', value: 'normal' },
]

export function ScenarioSwitch() {
  const { scenario, selectScenario } = useAppState()

  return (
    <fieldset className={styles.fieldset}>
      <legend className={styles.legend}>Escenario</legend>
      <div className={styles.options}>
        {options.map((option) => {
          const isSelected = scenario === option.value

          return (
            <button
              className={`${styles.option} ${isSelected ? styles.optionSelected : ''}`}
              key={option.value}
              type="button"
              aria-pressed={isSelected}
              onClick={() => selectScenario(option.value)}
            >
              {option.label}
            </button>
          )
        })}
      </div>
    </fieldset>
  )
}
