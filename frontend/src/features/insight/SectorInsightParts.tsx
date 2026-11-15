import type { ReactNode } from 'react'

import { useLanguage } from '../../app/i18n/languageContext'
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

export function InsightProvider({
  children,
  ...value
}: InsightContextValue & { children: ReactNode }) {
  return <InsightContext value={value}>{children}</InsightContext>
}

/** Nombre del sector, su estado de rotación y el dibujo que lo acompaña. */
export function InsightHeading() {
  const { sector } = useInsight()
  const { t, tr } = useLanguage()

  return (
    <header className={styles.heading}>
      <div className={styles.headingSprite}>
        {sector.rotation.status === 'resting' ? <LlamaResting /> : <Plant />}
      </div>
      <div>
        <h1>{sector.name}</h1>
        <p className={styles.rotation}>{tr(rotationText(sector))}</p>
        <p className={styles.note}>{t.simulatedRestNote}</p>
      </div>
    </header>
  )
}

/** El consejo, en grande, con su confianza siempre al lado. */
export function InsightRecommendation() {
  const { sector } = useInsight()
  const { t, tr } = useLanguage()
  const details = recommendationDetails(sector)

  return (
    <section aria-labelledby="consejo-titulo" className={styles.adviceCard}>
      <h2 id="consejo-titulo" className={styles.kicker}>
        {t.mainAdvice}
      </h2>
      <p className={styles.phrase}>{tr(sector.recommendation.text)}</p>
      {details.length > 0 ? (
        <ul className={styles.details}>
          {details.map((detail) => (
            <li key={detail}>{tr(detail)}</li>
          ))}
        </ul>
      ) : null}
      <p className={styles.confidence}>
        <strong>{t.howSure}</strong>{' '}
        {tr(confidenceText(sector.recommendation.confidence_label))}
      </p>
    </section>
  )
}

/** Botón que lee toda la ficha en voz alta. */
export function InsightListen() {
  const { sector, scenario } = useInsight()
  const { t } = useLanguage()

  return (
    <ListenButton
      id={`ficha-${sector.id}-${scenario}`}
      text={spokenSummary(sector, scenario)}
      label={t.listenAdvice}
    />
  )
}

export function InsightReasons() {
  const { sector } = useInsight()
  const { t, tr } = useLanguage()

  return (
    <section aria-labelledby="motivos-titulo">
      <h2 id="motivos-titulo" className={styles.subHeading}>
        {t.whyShort}
      </h2>
      <ul className={styles.bullets}>
        {sector.recommendation.reasons.map((reason) => (
          <li key={reason}>{tr(reason)}</li>
        ))}
      </ul>
    </section>
  )
}

export function InsightRisk() {
  const { sector, scenario } = useInsight()
  const { t, tr } = useLanguage()

  return (
    <section aria-labelledby="riesgo-titulo">
      <div className={styles.level}>
        <RiskScale level={sector.risk.level} />
        <h2 id="riesgo-titulo" className={styles.subHeading}>
          {tr(riskTitle(sector.risk.level))}
        </h2>
      </div>
      <p className={styles.shortText}>{tr(riskExplanation(scenario))}</p>
      {sector.risk.drivers.length > 0 ? (
        <ul className={styles.bullets}>
          {sector.risk.drivers.map((driver) => (
            <li key={driver.feature}>{tr(driverText(driver))}</li>
          ))}
        </ul>
      ) : null}
      <p className={styles.confidence}>
        <strong>{t.howSure}</strong>{' '}
        {tr(confidenceText(sector.risk.confidence_label))}
      </p>
    </section>
  )
}

export function InsightRecovery() {
  const { sector } = useInsight()
  const { t, tr } = useLanguage()

  return (
    <section aria-labelledby="recuperacion-titulo">
      <div className={styles.level}>
        <RecoveryScale level={sector.recovery.level} />
        <h2 id="recuperacion-titulo" className={styles.subHeading}>
          {tr(recoveryTitle(sector.recovery.level))}
        </h2>
      </div>
      <p className={styles.shortText}>
        {tr(recoveryExplanation(sector.recovery.level))}
      </p>
      <p className={styles.confidence}>
        <strong>{t.howSure}</strong>{' '}
        {tr(confidenceText(sector.recovery.confidence_label))}
      </p>
    </section>
  )
}

/** Precedente de la tierra gemela. No se muestra si no existe. */
export function InsightTwin() {
  const { sector } = useInsight()
  const { t, tr } = useLanguage()
  const twin = sector.twinPrecedent

  if (!twin) {
    return null
  }

  return (
    <section aria-labelledby="gemela-titulo">
      <h2 id="gemela-titulo" className={styles.subHeading}>
        {t.twinSectionTitle}
      </h2>
      <p className={styles.shortText}>{tr(twinText(twin))}</p>
      <p className={styles.caution}>{tr(twinCaution)}</p>
      <p className={styles.confidence}>
        <strong>{t.howSure}</strong>{' '}
        {tr(confidenceText(twin.confidence_label))}
        {twin.is_simulated ? ' · Límites simulados.' : ''}
      </p>
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
