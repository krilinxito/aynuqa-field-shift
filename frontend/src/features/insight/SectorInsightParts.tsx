import type { ReactNode } from 'react'

import { RecoveryScale, RiskScale } from '../../shared/components/LevelScale'
import { LlamaResting, Plant } from '../../shared/sprites/Sprites'
import { ListenButton } from '../speech/ListenButton'
import { Provenance } from '../zone/Provenance'
import { ZoneWeather } from '../zone/ZoneWeather'
import { InsightContext, useInsight, type InsightContextValue } from './insightContext'
import {
  confidenceText,
  driverText,
  recommendationDetails,
  recoveryExplanation,
  recoveryTitle,
  riskExplanation,
  riskTitle,
  rotationText,
  spokenSummary,
  twinCaution,
  twinText,
} from './insightText'
import styles from './SectorInsight.module.css'

/*
 * Piezas de la ficha de un sector. Cada pantalla arma la ficha con las
 * piezas que necesita; todas leen el mismo sector desde el contexto.
 */

export function InsightProvider({
  children,
  ...value
}: InsightContextValue & { children: ReactNode }) {
  return <InsightContext value={value}>{children}</InsightContext>
}

/** Nombre del sector, su estado de rotación y el dibujo que lo acompaña. */
export function InsightHeading() {
  const { sector } = useInsight()

  return (
    <header className={styles.heading}>
      <div className={styles.headingSprite}>
        {sector.rotation.status === 'resting' ? <LlamaResting /> : <Plant />}
      </div>
      <div>
        <h1>{sector.name}</h1>
        <p className={styles.rotation}>{rotationText(sector)}</p>
        <p className={styles.note}>Años de descanso simulados</p>
      </div>
    </header>
  )
}

/** El consejo, en grande, con su confianza siempre al lado. */
export function InsightRecommendation() {
  const { sector } = useInsight()
  const details = recommendationDetails(sector)

  return (
    <section aria-labelledby="consejo-titulo">
      <h2 id="consejo-titulo" className={styles.kicker}>
        Consejo para este sector
      </h2>
      <p className={styles.phrase}>{sector.recommendation.text}</p>
      {details.length > 0 ? (
        <ul className={styles.details}>
          {details.map((detail) => (
            <li key={detail}>{detail}</li>
          ))}
        </ul>
      ) : null}
      <p className={styles.confidence}>
        <strong>Qué tan seguros estamos:</strong>{' '}
        {confidenceText(sector.recommendation.confidence_label)}
      </p>
    </section>
  )
}

/** Botón que lee toda la ficha en voz alta. */
export function InsightListen() {
  const { sector, scenario } = useInsight()

  return (
    <ListenButton
      id={`ficha-${sector.id}-${scenario}`}
      text={spokenSummary(sector, scenario)}
      label="Escuchar el consejo"
    />
  )
}

export function InsightReasons() {
  const { sector } = useInsight()

  return (
    <section aria-labelledby="motivos-titulo">
      <h2 id="motivos-titulo">¿Por qué?</h2>
      <ul className={styles.bullets}>
        {sector.recommendation.reasons.map((reason) => (
          <li key={reason}>{reason}</li>
        ))}
      </ul>
    </section>
  )
}

export function InsightRisk() {
  const { sector, scenario } = useInsight()

  return (
    <section aria-labelledby="riesgo-titulo">
      <div className={styles.level}>
        <RiskScale level={sector.risk.level} />
        <h2 id="riesgo-titulo">{riskTitle(sector.risk.level)}</h2>
      </div>
      <p>{riskExplanation(scenario)}</p>
      {sector.risk.drivers.length > 0 ? (
        <>
          <p className={styles.listLabel}>Lo que más pesa:</p>
          <ul className={styles.bullets}>
            {sector.risk.drivers.map((driver) => (
              <li key={driver.feature}>{driverText(driver)}</li>
            ))}
          </ul>
        </>
      ) : null}
      <p className={styles.confidence}>
        <strong>Qué tan seguros estamos:</strong>{' '}
        {confidenceText(sector.risk.confidence_label)}
      </p>
    </section>
  )
}

export function InsightRecovery() {
  const { sector } = useInsight()

  return (
    <section aria-labelledby="recuperacion-titulo">
      <div className={styles.level}>
        <RecoveryScale level={sector.recovery.level} />
        <h2 id="recuperacion-titulo">{recoveryTitle(sector.recovery.level)}</h2>
      </div>
      <p>{recoveryExplanation(sector.recovery.level)}</p>
      <p className={styles.confidence}>
        <strong>Qué tan seguros estamos:</strong>{' '}
        {confidenceText(sector.recovery.confidence_label)}
      </p>
    </section>
  )
}

/** Precedente de la tierra gemela. No se muestra si no existe. */
export function InsightTwin() {
  const { sector } = useInsight()
  const twin = sector.twinPrecedent

  if (!twin) {
    return null
  }

  return (
    <section aria-labelledby="gemela-titulo">
      <h2 id="gemela-titulo">Qué pasó en una tierra parecida</h2>
      <p>{twinText(twin)}</p>
      <p className={styles.caution}>{twinCaution}</p>
      <p className={styles.confidence}>
        <strong>Qué tan seguros estamos:</strong>{' '}
        {confidenceText(twin.confidence_label)}
      </p>
      {twin.is_simulated ? (
        <p className={styles.note}>Los límites de esa tierra son simulados.</p>
      ) : null}
    </section>
  )
}

/** El tiempo de la zona: es el mismo para todos los sectores. */
export function InsightZoneWeather() {
  const { zone } = useInsight()

  return <ZoneWeather zone={zone} />
}

export function InsightProvenance() {
  const { provenance } = useInsight()

  return <Provenance provenance={provenance} />
}
