import { useEffect, useState, type ReactNode } from 'react'

import { useLanguage } from '../../app/i18n/languageContext'
import { usePreferences } from '../../app/preferences/preferencesContext'
import { useDataLayer } from '../../app/providers/dataRepositoryContext'
import type { BacktestResponse } from '../../data/contracts/generated'
import type {
  SectorDiagnosisViewModel,
  ZoneViewModel,
} from '../../domain/presentationModels'
import styles from './Advanced.module.css'
import { NdviSparkline, type NdviPoint } from './NdviSparkline'

function fmt(value: number | null | undefined, digits = 2): string {
  return value === null || value === undefined
    ? '—'
    : value.toLocaleString('es-BO', {
        minimumFractionDigits: digits,
        maximumFractionDigits: digits,
      })
}

/** Últimos 3 años: suficiente para ver la estación y legible en un celular. */
const NDVI_MONTHS = 36

function pct(value: number | null | undefined): string {
  return value === null || value === undefined ? '—' : `${Math.round(value * 100)} %`
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className={styles.row}>
      <dt>{label}</dt>
      <dd>{children}</dd>
    </div>
  )
}

/** Solo aparece con el modo avanzado encendido. */
export function AdvancedOnly({ children }: { children: ReactNode }) {
  const { preferences } = usePreferences()
  return preferences.advanced ? <>{children}</> : null
}

/** Todos los números del sector tal como los exporta ML. */
export function AdvancedSectorPanel({ sector }: { sector: SectorDiagnosisViewModel }) {
  const { t } = useLanguage()
  const { repository } = useDataLayer()
  const [series, setSeries] = useState<NdviPoint[] | null>(null)
  const twin = sector.twinPrecedent

  useEffect(() => {
    const controller = new AbortController()
    repository
      .getSectorHistory(sector.id, undefined, { signal: controller.signal })
      .then((history) =>
        setSeries(
          history.series
            .slice(-NDVI_MONTHS)
            .map((p) => ({ date: p.date, ndvi: p.ndvi })),
        ),
      )
      .catch(() => setSeries([]))
    return () => controller.abort()
  }, [repository, sector.id])

  return (
    <section className={styles.panel} aria-labelledby={`avanzado-${sector.id}`}>
      <h2 id={`avanzado-${sector.id}`} className={styles.title}>
        {t.advancedTitle} · {sector.name}
      </h2>
      <dl className={styles.list}>
        <Row label="Riesgo de sequía (0 a 1)">
          {fmt(sector.risk.score)} · intervalo {fmt(sector.risk.interval.low)}–
          {fmt(sector.risk.interval.high)} · {sector.risk.levelLabel}
        </Row>
        <Row label="Confianza del riesgo">
          {pct(sector.risk.confidence)} ({sector.risk.confidence_label})
        </Row>
        <Row label="Factores del riesgo (peso)">
          <ul className={styles.drivers}>
            {sector.risk.drivers.map((driver) => (
              <li key={driver.feature}>
                <code>{driver.feature}</code> {driver.label}:{' '}
                {driver.direction === 'increases' ? '↑' : '↓'} {fmt(driver.weight, 3)}
              </li>
            ))}
          </ul>
        </Row>
        <Row label="Recuperación del suelo (0 a 1)">
          {fmt(sector.recovery.score)} · confianza {pct(sector.recovery.confidence)}
        </Row>
        <Row label="Residuo RESTREND (NDVI)">{fmt(sector.recovery.ndvi_residual, 4)}</Row>
        <Row label={`NDVI (${sector.vegetation.dateText})`}>
          {sector.vegetation.ndvi.text} · anomalía {sector.vegetation.anomaly.text}
        </Row>
        <Row label="Terreno">
          {sector.terrain.elevation.text} · pendiente {sector.terrain.slope.text} ·
          orientación {sector.terrain.aspect.text}
        </Row>
        <Row label="Área">{sector.area.text}</Row>
        <Row label="Confianza del consejo">
          {pct(sector.recommendation.confidence)} ({sector.recommendation.confidence_label})
        </Row>
        {twin ? (
          <Row label={`Tierra gemela: ${twin.twin_zone} (${twin.event})`}>
            similitud {fmt(twin.similarity)} · anomalía NDVI observada{' '}
            {fmt(twin.observed_ndvi_anomaly)} · confianza {pct(twin.confidence)}
          </Row>
        ) : null}
      </dl>
      <h3 className={styles.subtitle}>{t.advancedNdviTitle}</h3>
      {series === null ? (
        <p className={styles.muted}>Cargando…</p>
      ) : (
        <NdviSparkline points={series} tableLabel={t.advancedTableToggle} />
      )}
      <p className={styles.muted}>
        Límites, años de descanso y área son simulados. El NDVI viene de satélite.
      </p>
    </section>
  )
}

/** Clima de la zona: es la misma celda NASA POWER para todos los sectores. */
export function AdvancedZonePanel({ zone }: { zone: ZoneViewModel }) {
  const { t } = useLanguage()
  const c = zone.climate

  return (
    <section className={styles.panel} aria-labelledby="avanzado-zona">
      <h2 id="avanzado-zona" className={styles.title}>
        {t.advancedZoneTitle}
      </h2>
      <dl className={styles.list}>
        <Row label={`RONI (NOAA, ${zone.roni.season ?? ''} ${zone.roni.year ?? ''})`}>
          {zone.roni.value.text} · {zone.roni.kindLabel}
        </Row>
        <Row label={`Lluvia (${zone.periodText})`}>
          {c.precipitation.text} · anomalía {c.precipitationAnomaly.text}
        </Row>
        <Row label="Temperatura">
          {c.temperature.text} · anomalía {c.temperatureAnomaly.text}
        </Row>
        <Row label="Humedad del suelo (0 a 1)">
          {c.soilMoisture.text} · anomalía {c.soilMoistureAnomaly.text}
        </Row>
      </dl>
    </section>
  )
}

const EVENTS = ['2015-16', '2023-24', '2020-22'] as const

function verdict(spearman: number | null): string {
  if (spearman === null) return 'sin dato'
  // Se espera correlación negativa: más riesgo, verdor más bajo de lo normal.
  if (spearman <= -0.5) return 'acierta bien'
  if (spearman <= -0.3) return 'acierta a medias (resultado modesto)'
  return 'no acierta en este evento'
}

/** Backtest: cada evento quedó fuera del entrenamiento. */
export function AdvancedBacktestPanel() {
  const { t } = useLanguage()
  const { repository } = useDataLayer()
  const [results, setResults] = useState<BacktestResponse[] | null>(null)

  useEffect(() => {
    const controller = new AbortController()
    Promise.allSettled(
      EVENTS.map((event) => repository.getBacktest(event, { signal: controller.signal })),
    ).then((settled) => {
      if (!controller.signal.aborted) {
        setResults(
          settled.flatMap((r) => (r.status === 'fulfilled' ? [r.value] : [])),
        )
      }
    }, () => undefined)
    return () => controller.abort()
  }, [repository])

  return (
    <section className={styles.panel} aria-labelledby="avanzado-backtest">
      <h2 id="avanzado-backtest" className={styles.title}>
        {t.advancedBacktestTitle}
      </h2>
      <p className={styles.muted}>
        Spearman entre riesgo predicho y anomalía de NDVI observada. Se espera que sea
        negativo. El evento evaluado quedó fuera del entrenamiento.
      </p>
      {results === null ? (
        <p className={styles.muted}>Cargando…</p>
      ) : results.length === 0 ? (
        <p className={styles.muted}>Sin datos de backtest.</p>
      ) : (
        <dl className={styles.list}>
          {results.map((result) => (
            <Row key={result.event} label={`${result.event} (${result.event_type})`}>
              Zona: ρ {fmt(result.zone.metric.spearman)} (n={result.zone.metric.n}) —{' '}
              {verdict(result.zone.metric.spearman)}. Por sector (solo NDVI): ρ{' '}
              {fmt(result.per_sector_metric.spearman)} (n={result.per_sector_metric.n}).
              {result.zone.metric.note ? (
                <span className={styles.note}> {result.zone.metric.note}</span>
              ) : null}
            </Row>
          ))}
        </dl>
      )}
    </section>
  )
}
