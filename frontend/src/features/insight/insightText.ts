/*
 * Frases en español simple a partir de los datos del sector. Aquí no se
 * calcula ni se inventa nada: solo se ponen en palabras los valores que
 * llegan de la API. Si un dato falta, se dice "sin dato".
 */
import type {
  SectorDiagnosisViewModel,
  ZoneViewModel,
} from '../../domain/presentationModels'
import type { Scenario } from '../../data/repositories/DataRepository'

type Level = 'low' | 'medium' | 'high'
type ConfidenceLabel = 'baja' | 'media' | 'alta'

const number = new Intl.NumberFormat('es-BO', { maximumFractionDigits: 1 })

const levelWords: Record<Level, string> = {
  low: 'bajo',
  medium: 'medio',
  high: 'alto',
}

const recoveryWords: Record<Level, string> = {
  low: 'poca',
  medium: 'a medias',
  high: 'buena',
}

export function years(count: number): string {
  return count === 1 ? '1 año' : `${count} años`
}

export function sectorNumber(sector: { id: string; name: string }): string {
  return sector.id.replace(/^S/, '')
}

export function rotationText(sector: SectorDiagnosisViewModel): string {
  const time = years(sector.rotation.yearsInStatus)

  return sector.rotation.status === 'resting'
    ? `En descanso hace ${time}`
    : `En cultivo hace ${time}`
}

export function recommendationDetails(
  sector: SectorDiagnosisViewModel,
): string[] {
  const { extend_rest_years: extra, crop, sowing_window: sowing } =
    sector.recommendation
  const details: string[] = []

  if (extra !== null) {
    details.push(`Descanso sugerido: ${years(extra)} más.`)
  }

  if (crop !== null) {
    details.push(`Cultivo sugerido: ${crop}.`)
  }

  if (sowing !== null) {
    details.push(`Siembra: ${sowing}.`)
  }

  return details
}

const confidenceMeaning: Record<ConfidenceLabel, string> = {
  baja: 'Tómelo solo como una señal: los datos no alcanzan para más.',
  media: 'Es una guía, no una certeza.',
  alta: 'Los datos coinciden bastante, pero nada es seguro.',
}

export function confidenceText(label: ConfidenceLabel): string {
  return `Confianza ${label}. ${confidenceMeaning[label]}`
}

export function riskTitle(level: Level): string {
  return `Riesgo de sequía: ${levelWords[level]}`
}

export function riskExplanation(scenario: Scenario): string {
  return scenario === 'nino'
    ? 'El Niño aumenta la probabilidad de sequía en el próximo ciclo. No es seguro que ocurra.'
    : 'Así se vería el riesgo en un año normal, sin El Niño.'
}

export function driverText(driver: {
  label: string
  direction: 'increases' | 'decreases'
}): string {
  return `${driver.label}: ${
    driver.direction === 'increases' ? 'sube el riesgo' : 'baja el riesgo'
  }.`
}

export function recoveryTitle(level: Level): string {
  return `Recuperación del suelo: ${recoveryWords[level]}`
}

export function recoveryExplanation(level: Level): string {
  switch (level) {
    case 'high':
      return 'El verdor del sector muestra que el suelo descansó bien.'
    case 'medium':
      return 'El verdor del sector muestra que el suelo todavía se está recuperando.'
    case 'low':
      return 'El verdor del sector muestra que al suelo le falta recuperarse.'
  }
}

function greennessPhrase(anomaly: number | null): string {
  if (anomaly === null) {
    return 'no tiene dato'
  }

  if (anomaly <= -1.5) {
    return 'estuvo muy por debajo de lo normal'
  }

  if (anomaly <= -0.5) {
    return 'estuvo por debajo de lo normal'
  }

  if (anomaly < 0.5) {
    return 'estuvo cerca de lo normal'
  }

  return 'estuvo por encima de lo normal'
}

function similarityPhrase(similarity: number): string {
  if (similarity >= 0.8) {
    return 'muy parecida'
  }

  return similarity >= 0.5 ? 'parecida' : 'algo parecida'
}

export function twinText(
  twin: NonNullable<SectorDiagnosisViewModel['twinPrecedent']>,
): string {
  return `En ${twin.twin_zone} hay una tierra ${similarityPhrase(
    twin.similarity,
  )} a este sector. Allí, durante El Niño de ${
    twin.event
  }, el verdor del campo ${greennessPhrase(twin.observed_ndvi_anomaly)}.`
}

export const twinCaution =
  'Es lo que pasó allá: sirve como precedente, no como garantía.'

function ninoStrength(value: number): string {
  if (value >= 1.5) {
    return 'El Niño está fuerte'
  }

  if (value >= 1) {
    return 'El Niño está moderado'
  }

  if (value >= 0.5) {
    return 'El Niño está débil'
  }

  if (value <= -0.5) {
    return 'Hay La Niña'
  }

  return 'El Niño no está activo'
}

export function ninoText(zone: ZoneViewModel): string {
  if (zone.roni.kind === 'assumed') {
    return 'Comparación: como si El Niño no estuviera activo.'
  }

  return `${ninoStrength(zone.roni.value.value ?? 0)} (índice ${zone.roni.value.text}).`
}

function withDifference(
  base: string,
  difference: number | null,
  unit: string,
): string {
  if (difference === null) {
    return base
  }

  if (difference === 0) {
    return `${base}, igual que lo normal`
  }

  return `${base}, ${number.format(Math.abs(difference))} ${unit} ${
    difference > 0 ? 'más' : 'menos'
  } que lo normal`
}

export interface WeatherLine {
  label: string
  text: string
}

export function weatherLines(zone: ZoneViewModel): WeatherLine[] {
  const { climate } = zone
  const missing = 'sin dato'

  return [
    {
      label: 'Lluvia del mes',
      text:
        climate.precipitation.value === null
          ? missing
          : withDifference(
              climate.precipitation.text,
              climate.precipitationAnomaly.value,
              '%',
            ),
    },
    {
      label: 'Temperatura',
      text:
        climate.temperature.value === null
          ? missing
          : withDifference(
              climate.temperature.text,
              climate.temperatureAnomaly.value,
              '°C',
            ),
    },
    {
      label: 'Humedad del suelo',
      text:
        climate.soilMoisture.value === null
          ? missing
          : `${number.format(climate.soilMoisture.value)} %`,
    },
  ]
}

/** Todo el consejo en un solo texto, para leerlo en voz alta. */
export function spokenSummary(
  sector: SectorDiagnosisViewModel,
  scenario: Scenario,
): string {
  const parts = [
    `${sector.name}. ${rotationText(sector)}.`,
    scenario === 'normal'
      ? 'Esto es una comparación con un año normal.'
      : '',
    `Consejo: ${sector.recommendation.text}`,
    ...recommendationDetails(sector),
    `Motivos: ${sector.recommendation.reasons.join(' ')}`,
    `${riskTitle(sector.risk.level)}. ${riskExplanation(scenario)}`,
    `${recoveryTitle(sector.recovery.level)}.`,
    confidenceText(sector.recommendation.confidence_label),
  ]

  return parts.filter(Boolean).join(' ')
}
