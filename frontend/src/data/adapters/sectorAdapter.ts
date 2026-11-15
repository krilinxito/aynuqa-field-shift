import type { SectorRiskResponse } from '../contracts/generated'
import type {
  SectorDiagnosisViewModel,
  SectorSnapshotViewModel,
  ZoneViewModel,
} from '../../domain/presentationModels'
import {
  formatPercentFromFraction,
  formatValue,
  formatYearMonth,
} from './formatters'
import { adaptProvenance } from './provenanceAdapter'

const levelLabels = {
  low: 'Bajo',
  medium: 'Medio',
  high: 'Alto',
} as const

const actionLabels = {
  open: 'Abrir para cultivo',
  extend_rest: 'Alargar el descanso',
  start_rest: 'Iniciar el descanso',
  keep_cultivating: 'Seguir cultivando',
} as const

const rotationLabels = {
  resting: 'En descanso',
  cultivated: 'En cultivo',
} as const

export function adaptZone(
  zone: SectorRiskResponse['zone'],
): ZoneViewModel {
  return {
    id: zone.id,
    name: zone.name,
    location: { lat: zone.lat, lon: zone.lon },
    period: zone.climate.period,
    periodText: formatYearMonth(zone.climate.period),
    roni: {
      value: formatValue(zone.roni.value),
      season: zone.roni.season,
      year: zone.roni.year,
      kind: zone.roni.kind,
      kindLabel:
        zone.roni.kind === 'observed' ? 'Observado' : 'Supuesto para comparar',
    },
    climate: {
      precipitation: formatValue(zone.climate.precip_mm, 'mm'),
      precipitationAnomaly: formatValue(
        zone.climate.precip_anomaly_pct,
        '%',
      ),
      temperature: formatValue(zone.climate.temp_c, '°C'),
      temperatureAnomaly: formatValue(zone.climate.temp_anomaly_c, '°C'),
      soilMoisture: formatPercentFromFraction(zone.climate.soil_moisture),
      soilMoistureAnomaly: formatValue(
        zone.climate.soil_moisture_anomaly,
      ),
    },
  }
}

export function adaptSector(
  sector: SectorRiskResponse['sectors'][number],
): SectorDiagnosisViewModel {
  return {
    id: sector.id,
    name: sector.name,
    geometry: sector.geometry,
    centroid: sector.centroid,
    area: formatValue(sector.area_ha, 'ha'),
    terrain: {
      elevation: formatValue(sector.terrain.elevation_m, 'm'),
      slope: formatValue(sector.terrain.slope_pct, '%'),
      aspect: formatValue(sector.terrain.aspect_deg, '°'),
    },
    rotation: {
      status: sector.rotation.status,
      statusLabel: rotationLabels[sector.rotation.status],
      yearsInStatus: sector.rotation.years_in_status,
      isSimulated: sector.rotation.is_simulated,
    },
    vegetation: {
      date: sector.vegetation.date,
      dateText: formatYearMonth(sector.vegetation.date),
      ndvi: formatValue(sector.vegetation.ndvi),
      anomaly: formatValue(sector.vegetation.ndvi_anomaly, 'DE'),
    },
    risk: {
      ...sector.risk,
      levelLabel: levelLabels[sector.risk.level],
    },
    recovery: {
      ...sector.recovery,
      levelLabel: levelLabels[sector.recovery.level],
    },
    recommendation: {
      ...sector.recommendation,
      actionLabel: actionLabels[sector.recommendation.action],
    },
    twinPrecedent: sector.twin_precedent,
    isSimulated: sector.is_simulated,
  }
}

export function adaptSectorSnapshot(
  response: SectorRiskResponse,
): SectorSnapshotViewModel {
  return {
    scenario: response.scenario,
    scenarioLabel:
      response.scenario === 'nino' ? 'El Niño actual' : 'Año normal',
    zone: adaptZone(response.zone),
    sectors: response.sectors.map(adaptSector),
    provenance: adaptProvenance({
      updatedAt: response.updated_at,
      dataSource: response.data_source,
      isSimulated: response.sectors.some((sector) => sector.is_simulated),
    }),
  }
}
