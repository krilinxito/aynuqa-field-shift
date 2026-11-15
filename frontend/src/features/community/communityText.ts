/*
 * Resumen de la comunidad en español simple. Solo agrupa, cuenta y pone en
 * palabras lo que trae cada sector: no calcula predicciones ni promedia
 * valores. Lo que no se sabe, no se dice.
 */
import type { Scenario } from '../../data/repositories/DataRepository'
import type { SectorDiagnosisViewModel } from '../../domain/presentationModels'
import {
  greennessPhrase,
  riskExplanation,
  sectorNumber,
} from '../insight/insightText'

type Sector = SectorDiagnosisViewModel
type Action = Sector['recommendation']['action']
type Level = Sector['risk']['level']
type ConfidenceLabel = Sector['risk']['confidence_label']

/** "1", "1 y 2", "1, 2 y 3". */
export function listWords(items: readonly string[]): string {
  if (items.length <= 1) {
    return items.join('')
  }

  return `${items.slice(0, -1).join(', ')} y ${items[items.length - 1]}`
}

/** "el sector 4" o "los sectores 1, 2 y 3". */
export function sectorsPhrase(sectors: readonly Sector[]): string {
  const numbers = sectors.map(sectorNumber)

  return numbers.length === 1
    ? `el sector ${numbers[0]}`
    : `los sectores ${listWords(numbers)}`
}

/** "al sector 4" o "a los sectores 1, 2 y 3". */
export function toSectorsPhrase(sectors: readonly Sector[]): string {
  const phrase = sectorsPhrase(sectors)

  return phrase.startsWith('el ') ? `al ${phrase.slice(3)}` : `a ${phrase}`
}

const actionOrder: readonly Action[] = [
  'open',
  'extend_rest',
  'keep_cultivating',
  'start_rest',
]

const actionTitles: Record<Action, string> = {
  open: 'Abrir para cultivo',
  extend_rest: 'Seguir en descanso',
  keep_cultivating: 'Seguir cultivando',
  start_rest: 'Pasar a descanso después de la cosecha',
}

export interface ActionGroup {
  action: Action
  title: string
  sectors: Sector[]
}

/** Sectores agrupados por lo que se recomienda hacer con ellos. */
export function groupByAction(sectors: readonly Sector[]): ActionGroup[] {
  return actionOrder
    .map((action) => ({
      action,
      title: actionTitles[action],
      sectors: sectors.filter(
        (sector) => sector.recommendation.action === action,
      ),
    }))
    .filter((group) => group.sectors.length > 0)
}

const levelOrder: readonly Level[] = ['high', 'medium', 'low']

const levelWords: Record<Level, string> = {
  high: 'alto',
  medium: 'medio',
  low: 'bajo',
}

export interface RiskGroup {
  level: Level
  title: string
  sectors: Sector[]
}

/** Cuántos sectores hay en cada nivel de riesgo, del más alto al más bajo. */
export function groupByRisk(sectors: readonly Sector[]): RiskGroup[] {
  return levelOrder
    .map((level) => ({
      level,
      title: `Riesgo ${levelWords[level]}`,
      sectors: sectors.filter((sector) => sector.risk.level === level),
    }))
    .filter((group) => group.sectors.length > 0)
}

const confidenceOrder: readonly ConfidenceLabel[] = ['baja', 'media', 'alta']

/** La confianza más baja de un grupo: se muestra la más prudente. */
export function lowestConfidence(
  labels: readonly ConfidenceLabel[],
): ConfidenceLabel | null {
  return confidenceOrder.find((label) => labels.includes(label)) ?? null
}

export interface TwinGroup {
  key: string
  zone: string
  event: string
  sectors: Sector[]
  /** Qué pasó con el verdor, sin repetir frases iguales. */
  outcomes: { phrase: string; sectors: Sector[] }[]
  confidence: ConfidenceLabel | null
  isSimulated: boolean
}

/** Precedentes de tierras gemelas, una entrada por tierra y evento. */
export function groupTwins(sectors: readonly Sector[]): TwinGroup[] {
  const groups = new Map<string, TwinGroup>()

  for (const sector of sectors) {
    const twin = sector.twinPrecedent

    if (!twin) {
      continue
    }

    const key = `${twin.twin_zone}|${twin.event}`
    const group = groups.get(key) ?? {
      key,
      zone: twin.twin_zone,
      event: twin.event,
      sectors: [],
      outcomes: [],
      confidence: null,
      isSimulated: false,
    }
    const phrase = greennessPhrase(twin.observed_ndvi_anomaly)
    const outcome = group.outcomes.find((item) => item.phrase === phrase)

    if (outcome) {
      outcome.sectors.push(sector)
    } else {
      group.outcomes.push({ phrase, sectors: [sector] })
    }

    group.sectors.push(sector)
    group.isSimulated = group.isSimulated || twin.is_simulated
    groups.set(key, group)
  }

  return [...groups.values()].map((group) => ({
    ...group,
    confidence: lowestConfidence(
      group.sectors.flatMap((sector) =>
        sector.twinPrecedent ? [sector.twinPrecedent.confidence_label] : [],
      ),
    ),
  }))
}

export function twinGroupText(group: TwinGroup): string {
  const resembles = `Se parece ${toSectorsPhrase(group.sectors)}.`
  const during = `Allí, durante El Niño de ${group.event}, el verdor del campo`

  if (group.outcomes.length === 1) {
    return `${resembles} ${during} ${group.outcomes[0].phrase}.`
  }

  const outcomes = group.outcomes.map(
    (outcome) =>
      `${outcome.phrase} en la tierra parecida ${toSectorsPhrase(outcome.sectors)}`,
  )

  return `${resembles} ${during} ${listWords(outcomes)}.`
}

/** Todo el resumen en un solo texto, para leerlo en voz alta. */
export function spokenCommunitySummary(
  communityName: string,
  sectors: readonly Sector[],
  scenario: Scenario,
): string {
  const actions = groupByAction(sectors).map(
    (group) => `${group.title}: ${sectorsPhrase(group.sectors)}.`,
  )
  const risks = groupByRisk(sectors).map(
    (group) => `${group.title} en ${sectorsPhrase(group.sectors)}.`,
  )
  const confidence = lowestConfidence(
    sectors.map((sector) => sector.recommendation.confidence_label),
  )

  return [
    `Comunidad de ${communityName}.`,
    scenario === 'normal' ? 'Esto es una comparación con un año normal.' : '',
    'Qué conviene este año.',
    ...actions,
    'Riesgo de sequía.',
    ...risks,
    riskExplanation(scenario),
    confidence ? `La confianza más baja de estos consejos es ${confidence}.` : '',
  ]
    .filter(Boolean)
    .join(' ')
}
