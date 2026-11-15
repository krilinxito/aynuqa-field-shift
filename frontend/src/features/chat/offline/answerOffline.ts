import type { Language } from '../../../app/i18n/languageContext'
import type { SectorSnapshotViewModel } from '../../../domain/presentationModels'
import { answerLocally, type LocalAnswer } from './localAnswers'

/**
 * Punto único para contestar sin señal. Hoy usa las plantillas; si la persona
 * descargó la IA local, la usa para redactar (ver `localModel.ts`).
 */
export async function answerOffline(
  question: string,
  snapshot: SectorSnapshotViewModel,
  options: { sectorId: string | null; lang: Language },
): Promise<LocalAnswer> {
  await Promise.resolve()
  return answerLocally(question, snapshot, options)
}
