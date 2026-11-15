import { describe, expect, it } from 'vitest'

import { contractFixtures } from '../contracts/contractFixtures'
import { parseContract } from '../contracts/contractValidator'
import { adaptBacktest } from './backtestAdapter'
import { adaptDataError } from './errorAdapter'
import { formatValue } from './formatters'
import { adaptHistory } from './historyAdapter'
import { adaptSectorSnapshot } from './sectorAdapter'
import { adaptSensors } from './sensorsAdapter'
import { ContractError } from '../transport/errors'

describe('adaptadores de presentación', () => {
  it('separa condiciones regionales y diagnóstico sectorial', () => {
    const response = parseContract('sectorRisk', contractFixtures.sectorsNino)
    const adapted = adaptSectorSnapshot(response)

    expect(adapted.zone.climate.precipitation.value).toBe(
      response.zone.climate.precip_mm,
    )
    expect(adapted.sectors).toHaveLength(8)
    expect(adapted.sectors[0]).not.toHaveProperty('climate')
    expect(adapted.sectors[0]?.risk.score).toBe(response.sectors[0].risk.score)
    expect(adapted.sectors[0]?.risk.level).toBe(response.sectors[0].risk.level)
    expect(adapted.sectors[0]?.risk.confidence_label).toBe(
      response.sectors[0].risk.confidence_label,
    )
  })

  it('separa las escalas del histórico y conserva null', () => {
    const response = parseContract('history', contractFixtures.historyS1)
    const adapted = adaptHistory(response)

    expect(adapted.sectorSeries).toHaveLength(322)
    expect(adapted.regionalSeries).toHaveLength(322)
    expect(adapted.globalSeries).toHaveLength(322)
    expect(adapted.sectorSeries.some((point) => point.ndvi === null)).toBe(true)
    expect(adapted.globalSeries.some((point) => point.roni === null)).toBe(true)
  })

  it('no convierte null en cero al formatear', () => {
    expect(formatValue(null, 'mm')).toEqual({
      value: null,
      unit: 'mm',
      text: 'Sin dato disponible',
    })
  })

  it('preserva métricas de backtest y alertas de sensores', () => {
    const backtest = parseContract('backtest', contractFixtures.backtest2015)
    const sensors = parseContract('sensors', contractFixtures.sensorsS1)
    const adaptedBacktest = adaptBacktest(backtest)
    const adaptedSensors = adaptSensors(sensors)

    expect(adaptedBacktest.zone.metric).toEqual(backtest.zone.metric)
    expect(adaptedBacktest.perSectorMetric).toEqual(backtest.per_sector_metric)
    expect(adaptedSensors.readings.map((reading) => reading.frostAlert)).toEqual(
      sensors.readings.map((reading) => reading.frost_alert),
    )
    expect(adaptedSensors.provenance.isSimulated).toBe(true)
  })

  it('no expone detalles técnicos de contratos a la interfaz', () => {
    expect(adaptDataError(new ContractError('sectorRisk'))).toBe(
      'Los datos recibidos no son compatibles con esta versión.',
    )
  })
})
