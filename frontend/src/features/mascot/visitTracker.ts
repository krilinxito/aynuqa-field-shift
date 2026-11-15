import { readStored, storageKeys, writeStored } from '../../app/state/deviceStorage'

/** Lo que la llamita recuerda de las visitas, guardado en el celular. */
export interface VisitRecord {
  /** Último día con visita, `YYYY-MM-DD` en hora de Bolivia. */
  lastVisit: string | null
  /** Días seguidos con visita. */
  streak: number
}

export interface VisitInfo {
  streak: number
  /** Días sin abrir la app antes de hoy (0 si ya vino hoy o ayer). */
  daysAway: number
  /** Primera visita de la vida. */
  firstTime: boolean
}

export function todayInBolivia(now: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/La_Paz',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

function daysBetween(from: string, to: string): number {
  const ms = Date.parse(`${to}T00:00:00Z`) - Date.parse(`${from}T00:00:00Z`)
  return Math.round(ms / 86_400_000)
}

/** Calcula la racha nueva a partir de la anterior. Función pura. */
export function updateVisit(
  record: VisitRecord,
  today: string,
): { record: VisitRecord; info: VisitInfo } {
  if (!record.lastVisit) {
    return {
      record: { lastVisit: today, streak: 1 },
      info: { streak: 1, daysAway: 0, firstTime: true },
    }
  }

  const gap = daysBetween(record.lastVisit, today)
  if (gap <= 0) {
    return {
      record,
      info: { streak: record.streak, daysAway: 0, firstTime: false },
    }
  }
  const streak = gap === 1 ? record.streak + 1 : 1
  return {
    record: { lastVisit: today, streak },
    info: { streak, daysAway: gap === 1 ? 0 : gap - 1, firstTime: false },
  }
}

export function readVisitRecord(): VisitRecord {
  try {
    const raw = readStored(storageKeys.mascot)
    const parsed = raw ? (JSON.parse(raw) as Partial<VisitRecord>) : {}
    return {
      lastVisit: typeof parsed.lastVisit === 'string' ? parsed.lastVisit : null,
      streak: typeof parsed.streak === 'number' ? parsed.streak : 0,
    }
  } catch {
    return { lastVisit: null, streak: 0 }
  }
}

export function writeVisitRecord(record: VisitRecord): void {
  writeStored(storageKeys.mascot, JSON.stringify(record))
}
