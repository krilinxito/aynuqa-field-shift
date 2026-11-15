import type { DisplayValue } from '../../domain/presentationModels'

const numberFormatter = new Intl.NumberFormat('es-BO', {
  maximumFractionDigits: 2,
})

const dateFormatter = new Intl.DateTimeFormat('es-BO', {
  dateStyle: 'medium',
  timeStyle: 'short',
  timeZone: 'America/La_Paz',
})

const monthFormatter = new Intl.DateTimeFormat('es-BO', {
  month: 'long',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatValue(
  value: number | null,
  unit: string | null = null,
): DisplayValue {
  return {
    value,
    unit,
    text:
      value === null
        ? 'Sin dato disponible'
        : `${numberFormatter.format(value)}${unit ? ` ${unit}` : ''}`,
  }
}

export function formatPercentFromFraction(
  value: number | null,
): DisplayValue {
  return formatValue(value === null ? null : value * 100, '%')
}

export function formatDateTime(value: string): string {
  return dateFormatter.format(new Date(value))
}

export function formatYearMonth(value: string): string {
  return monthFormatter.format(new Date(`${value}-01T00:00:00Z`))
}
