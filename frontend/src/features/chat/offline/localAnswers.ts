import { translatePhrase, type Language } from '../../../app/i18n/languageContext'
import type {
  SectorDiagnosisViewModel,
  SectorSnapshotViewModel,
} from '../../../domain/presentationModels'
import {
  confidenceText,
  recommendationDetails,
  riskExplanation,
  riskTitle,
  sectorNumber,
} from '../../insight/insightText'

/**
 * Respuestas sin señal: sin modelo de IA. Reconoce qué se pregunta por
 * palabras clave (español, aymara, quechua) y contesta con plantillas y los
 * datos guardados en el celular. Nunca calcula ni inventa números.
 */
export type LocalIntent =
  | 'open'
  | 'risk'
  | 'sow'
  | 'rest'
  | 'nino'
  | 'confidence'
  | 'summary'

export interface LocalAnswer {
  intent: LocalIntent
  text: string
  confidenceNote: string
}

const INTENT_PATTERNS: ReadonlyArray<[LocalIntent, RegExp]> = [
  ['nino', /ni[ñn]o|roni/i],
  ['sow', /sembr|siembr|cultiv[oa]r?\b|papa|quinua|jupha|kinwa|yapuch|tarpu/i],
  ['rest', /descans|samar|samay|alarg/i],
  ['open', /abrir|abre|llawir|kichar|qu[eé] sector|cu[aá]l(es)? sector|kawk[iï]r|mayqin/i],
  ['risk', /riesgo|sequ[ií]a|seca|wa[ñn]a|ch.?aki|lluvia|jallu|para\b/i],
  ['confidence', /confian|segur|atinis|atieneku/i],
]

export function detectIntent(question: string): LocalIntent {
  for (const [intent, pattern] of INTENT_PATTERNS) {
    if (pattern.test(question)) return intent
  }
  return 'summary'
}

/** "sector 4", "suyu 4" o un número suelto que exista en la comunidad. */
export function findSector(
  question: string,
  sectors: readonly SectorDiagnosisViewModel[],
): SectorDiagnosisViewModel | null {
  for (const match of question.matchAll(/\b(\d{1,2})\b/g)) {
    const found = sectors.find((s) => sectorNumber(s) === match[1])
    if (found) return found
  }
  return null
}

function list(numbers: string[]): string {
  if (numbers.length <= 1) return numbers.join('')
  return `${numbers.slice(0, -1).join(', ')} y ${numbers[numbers.length - 1]}`
}

function sectorsWord(numbers: string[]): string {
  return numbers.length === 1 ? `el sector ${numbers[0]}` : `los sectores ${list(numbers)}`
}

function lowest(sectors: readonly SectorDiagnosisViewModel[]) {
  const order = { baja: 0, media: 1, alta: 2 } as const
  return [...sectors].sort(
    (a, b) =>
      order[a.recommendation.confidence_label] - order[b.recommendation.confidence_label],
  )[0]?.recommendation.confidence_label
}

function aboutSector(intent: LocalIntent, sector: SectorDiagnosisViewModel, scenario: SectorSnapshotViewModel['scenario']): string {
  const n = sectorNumber(sector)
  const details = recommendationDetails(sector).join(' ')
  switch (intent) {
    case 'risk':
      return `Sector ${n}. ${riskTitle(sector.risk.level)}. ${riskExplanation(scenario)}`
    case 'sow':
      return sector.recommendation.crop || sector.recommendation.sowing_window
        ? `Sector ${n}. ${details}`
        : `Sector ${n}: este año no se sugiere sembrar. ${sector.recommendation.text}`
    case 'rest':
      return `Sector ${n}. ${sector.recommendation.text} ${details}`.trim()
    default:
      return `Sector ${n}: ${sector.recommendation.text} ${details}`.trim()
  }
}

function aboutCommunity(intent: LocalIntent, snapshot: SectorSnapshotViewModel): string {
  const sectors = snapshot.sectors
  const numbers = (filter: (s: SectorDiagnosisViewModel) => boolean) =>
    sectors.filter(filter).map(sectorNumber)

  switch (intent) {
    case 'open': {
      const open = numbers((s) => s.recommendation.action === 'open')
      return open.length
        ? `Se puede abrir ${sectorsWord(open)} para cultivo.`
        : 'Este año no se sugiere abrir ningún sector.'
    }
    case 'risk': {
      const high = numbers((s) => s.risk.level === 'high')
      return high.length
        ? `Riesgo alto de sequía en ${sectorsWord(high)}. ${riskExplanation(snapshot.scenario)}`
        : `Ningún sector tiene riesgo alto. ${riskExplanation(snapshot.scenario)}`
    }
    case 'sow': {
      const sow = sectors.filter((s) => s.recommendation.crop)
      if (!sow.length) return 'Este año no se sugiere sembrar en ningún sector.'
      return sow
        .map((s) => `Sector ${sectorNumber(s)}: ${recommendationDetails(s).join(' ')}`)
        .join(' ')
    }
    case 'rest': {
      const rest = numbers((s) => s.recommendation.action === 'extend_rest')
      return rest.length
        ? `Conviene seguir en descanso: ${sectorsWord(rest)}.`
        : 'Ningún sector necesita alargar el descanso.'
    }
    case 'nino': {
      const roni = snapshot.zone.roni.value.text
      return snapshot.scenario === 'nino'
        ? `Hoy hay El Niño (índice RONI de NOAA: ${roni}). El Niño aumenta la probabilidad de sequía; no es seguro que ocurra.`
        : 'Está viendo la comparación con un año normal, sin El Niño.'
    }
    default: {
      const open = numbers((s) => s.recommendation.action === 'open')
      const rest = numbers((s) => s.recommendation.action === 'extend_rest')
      const parts = []
      if (open.length) parts.push(`Se puede abrir ${sectorsWord(open)}.`)
      if (rest.length) parts.push(`Conviene seguir en descanso: ${sectorsWord(rest)}.`)
      return parts.join(' ') || 'No tengo ese dato guardado.'
    }
  }
}

export function answerLocally(
  question: string,
  snapshot: SectorSnapshotViewModel,
  options: { sectorId: string | null; lang: Language },
): LocalAnswer {
  const intent = detectIntent(question)
  const sector =
    findSector(question, snapshot.sectors) ??
    snapshot.sectors.find((s) => s.id === options.sectorId) ??
    null

  const label =
    intent === 'nino'
      ? null
      : sector
        ? sector.recommendation.confidence_label
        : (lowest(snapshot.sectors) ?? null)
  const body =
    intent === 'nino' || !sector ? aboutCommunity(intent, snapshot) : aboutSector(intent, sector, snapshot.scenario)
  const confidence = label ? confidenceText(label) : 'El Niño se mide con el RONI de NOAA.'
  const text = `${body} ${intent === 'confidence' ? confidence : ''}`.trim()

  return {
    intent,
    text: translatePhrase(text, options.lang),
    confidenceNote: translatePhrase(
      `${confidence} Respuesta sin señal, con los datos guardados.`,
      options.lang,
    ),
  }
}
