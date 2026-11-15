import styles from './LevelScale.module.css'

type Level = 'low' | 'medium' | 'high'

const steps: readonly Level[] = ['low', 'medium', 'high']

interface ScaleProps {
  level: Level
}

interface BarsProps extends ScaleProps {
  tone: string
}

/*
 * Tres barras que suben, como las de la señal del celular. El nivel se lee
 * por la cantidad de barras llenas, no solo por el color, y siempre va
 * acompañado de la palabra que escribe quien usa la escala.
 */
function Bars({ level, tone }: BarsProps) {
  const filled = steps.indexOf(level) + 1

  return (
    <span className={`${styles.bars} ${tone}`} aria-hidden="true">
      {steps.map((step, index) => (
        <span
          key={step}
          className={`${styles.bar} ${index < filled ? styles.filled : ''}`}
        />
      ))}
    </span>
  )
}

const riskTones: Record<Level, string> = {
  low: styles.riskLow,
  medium: styles.riskMedium,
  high: styles.riskHigh,
}

/** Escala de riesgo: más barras es peor. */
export function RiskScale({ level }: ScaleProps) {
  return <Bars level={level} tone={riskTones[level]} />
}

/** Escala de recuperación: más barras es mejor. */
export function RecoveryScale({ level }: ScaleProps) {
  return <Bars level={level} tone={styles.recovery} />
}
