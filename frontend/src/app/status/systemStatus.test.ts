import { describe, expect, it } from 'vitest'

import type { HealthResponse } from '../../data/contracts/generated'
import { getSystemStatus, resolveDataMode } from './systemStatus'

const health: HealthResponse = {
  status: 'ok',
  version: '0.1.0',
  updated_at: '2026-11-14T12:00:00-04:00',
  sources: {
    predictions: 'mock',
    history: 'mock',
    backtest: 'mock',
    analogs: 'mock',
  },
}

describe('estado de conexión y procedencia', () => {
  it('usa mock por defecto y nunca lo presenta como servidor conectado', () => {
    expect(resolveDataMode(undefined)).toBe('mock')
    const status = getSystemStatus({
      dataMode: 'mock',
      isOnline: true,
      healthStatus: 'success',
      health,
    })

    expect(status.primaryLabel).toBe('Datos de demostración')
    expect(status.updateLabel).toContain('Referencia del fixture:')
    expect(status.updatedAt).toBe(health.updated_at)
  })

  it('informa la falta de conectividad del dispositivo antes que el backend', () => {
    expect(
      getSystemStatus({
        dataMode: 'api',
        isOnline: false,
        healthStatus: 'success',
        health,
      }).primaryLabel,
    ).toBe('Sin conexión detectada')
  })

  it('solo confirma el servicio API después de health', () => {
    expect(
      getSystemStatus({
        dataMode: 'api',
        isOnline: true,
        healthStatus: 'loading',
      }).primaryLabel,
    ).toBe('Verificando servicio')
    expect(
      getSystemStatus({
        dataMode: 'api',
        isOnline: true,
        healthStatus: 'success',
        health,
      }).primaryLabel,
    ).toBe('Servicio disponible')
  })

  it('mantiene el shell operativo cuando health falla', () => {
    expect(
      getSystemStatus({
        dataMode: 'api',
        isOnline: true,
        healthStatus: 'error',
      }),
    ).toMatchObject({
      primaryLabel: 'No se pudo verificar el servicio',
      updateLabel: 'Actualización no disponible',
      tone: 'warning',
    })
  })
})
