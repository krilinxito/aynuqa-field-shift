import type { QueryStatus } from '../../data/cache/QueryClient'
import type { HealthResponse } from '../../data/contracts/generated'

export type DataMode = 'mock' | 'api'

export interface SystemStatusInput {
  dataMode: DataMode
  isOnline: boolean
  healthStatus: QueryStatus
  health?: HealthResponse
}

export interface SystemStatusViewModel {
  primaryLabel: string
  secondaryLabel?: string
  updateLabel: string
  updatedAt?: string
  tone: 'neutral' | 'success' | 'warning'
}

export function resolveDataMode(value: string | undefined): DataMode {
  return value === 'api' ? 'api' : 'mock'
}

export function formatHealthUpdatedAt(value: string): string {
  return new Intl.DateTimeFormat('es-BO', {
    dateStyle: 'medium',
    timeStyle: 'short',
    timeZone: 'America/La_Paz',
  }).format(new Date(value))
}

export function getSystemStatus({
  dataMode,
  isOnline,
  healthStatus,
  health,
}: SystemStatusInput): SystemStatusViewModel {
  const updateLabel = health
    ? `${dataMode === 'mock' ? 'Referencia del fixture' : 'Servicio actualizado'}: ${formatHealthUpdatedAt(health.updated_at)}`
    : 'Actualización no disponible'

  if (!isOnline) {
    return {
      primaryLabel: 'Sin conexión detectada',
      secondaryLabel: dataMode === 'mock' ? 'Datos de demostración' : undefined,
      updateLabel,
      updatedAt: health?.updated_at,
      tone: 'warning',
    }
  }

  if (dataMode === 'mock') {
    return {
      primaryLabel: 'Datos de demostración',
      updateLabel,
      updatedAt: health?.updated_at,
      tone: 'neutral',
    }
  }

  if (healthStatus === 'success') {
    return {
      primaryLabel: 'Servicio disponible',
      updateLabel,
      updatedAt: health?.updated_at,
      tone: 'success',
    }
  }

  if (healthStatus === 'error') {
    return {
      primaryLabel: 'No se pudo verificar el servicio',
      updateLabel,
      updatedAt: health?.updated_at,
      tone: 'warning',
    }
  }

  return {
    primaryLabel: 'Verificando servicio',
    updateLabel,
    updatedAt: health?.updated_at,
    tone: 'neutral',
  }
}
