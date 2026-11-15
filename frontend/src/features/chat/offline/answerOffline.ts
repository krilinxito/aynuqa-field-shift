import type { Language } from '../../../app/i18n/languageContext'
import type { SectorSnapshotViewModel } from '../../../domain/presentationModels'
import { answerLocally, type LocalAnswer } from './localAnswers'
import { rephraseWithLocalModel } from './localModel'

/**
 * Punto único para contestar sin señal: siempre las plantillas, y si la
 * persona descargó la IA local (y pregunta en español), la usa para redactar.
 */
export async function answerOffline(
  question: string,
  snapshot: SectorSnapshotViewModel,
  options: { sectorId: string | null; lang: Language },
): Promise<LocalAnswer> {
  const template = answerLocally(question, snapshot, options)
  if (options.lang !== 'es') return template

  const rephrased = await rephraseWithLocalModel(question, template.text)
  return rephrased ? { ...template, text: rephrased } : template
}
