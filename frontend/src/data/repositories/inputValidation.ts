import { ApiError } from '../transport/errors'
import type {
  BacktestEvent,
  DateRange,
  Scenario,
} from './DataRepository'

const sectorPattern = /^S\d+$/
const yearMonthPattern = /^\d{4}-(0[1-9]|1[0-2])$/
const backtestEvents = new Set<BacktestEvent>([
  '2015-16',
  '2023-24',
  '2020-22',
])

function invalidRequest(message: string): never {
  throw new ApiError(422, 'invalid_request', message)
}

export function assertScenario(value: string): asserts value is Scenario {
  if (value !== 'nino' && value !== 'normal') {
    invalidRequest('El escenario debe ser nino o normal.')
  }
}

export function assertSectorId(value: string): void {
  if (!sectorPattern.test(value)) {
    invalidRequest('El identificador de sector no es válido.')
  }
}

export function assertBacktestEvent(
  value: string,
): asserts value is BacktestEvent {
  if (!backtestEvents.has(value as BacktestEvent)) {
    invalidRequest('El evento de backtest no es válido.')
  }
}

export function assertHours(value: number): void {
  if (!Number.isInteger(value) || value < 1 || value > 168) {
    invalidRequest('Las horas deben ser un entero entre 1 y 168.')
  }
}

export function assertDateRange(range?: DateRange): void {
  if (!range) {
    return
  }

  for (const value of [range.from, range.to]) {
    if (value !== undefined && !yearMonthPattern.test(value)) {
      invalidRequest('Las fechas deben usar el formato YYYY-MM.')
    }
  }

  if (range.from && range.to && range.from > range.to) {
    invalidRequest('La fecha inicial no puede ser posterior a la final.')
  }
}

export function isSectorId(value: string | null): value is string {
  return value !== null && sectorPattern.test(value)
}

export function isYearMonth(value: string | null): value is string {
  return value !== null && yearMonthPattern.test(value)
}
