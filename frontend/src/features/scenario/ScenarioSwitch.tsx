import { useLanguage } from '../../app/i18n/languageContext'
import { useAppState } from '../../app/providers/appStateContext'
import type { Scenario } from '../../data/repositories/DataRepository'
import styles from './ScenarioSwitch.module.css'

/**
 * Compara lo que pasa hoy (El Niño, el estado real) con un año normal.
 */
export function ScenarioSwitch() {
  const { state, actions } = useAppState()
  const { t } = useLanguage()

  const options: ReadonlyArray<{ label: string; value: Scenario }> = [
    { label: t.todayNino, value: 'nino' },
    { label: t.normalYear, value: 'normal' },
  ]

  return (
    <div className="no-imprimir">
      <fieldset className={styles.fieldset}>
        <legend className={styles.legend}>{t.seeAdviceFor}</legend>
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
          <strong>{t.comparisonTitle}</strong> {t.comparisonBody}
        </p>
      ) : null}
    </div>
  )
}
