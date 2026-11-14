import type {
  BacktestResponse,
  HealthResponse,
  SectorRiskResponse,
} from '../data/contracts/generated'

export interface DisplayValue {
  value: number | null
  text: string
  unit: string | null
}

export interface ProvenanceViewModel {
  updatedAt: string
  updatedAtText: string
  dataSource: 'mock' | 'real' | null
  isSimulated: boolean | null
  sourceGroups: HealthResponse['sources'] | null
}

export interface ZoneViewModel {
  id: string
  name: string
  location: { lat: number; lon: number }
  period: string
  periodText: string
  roni: {
    value: DisplayValue
    season: string | null
    year: number | null
    kind: 'observed' | 'assumed'
    kindLabel: string
  }
  climate: {
    precipitation: DisplayValue
    precipitationAnomaly: DisplayValue
    temperature: DisplayValue
    temperatureAnomaly: DisplayValue
    soilMoisture: DisplayValue
    soilMoistureAnomaly: DisplayValue
  }
}

export interface SectorDiagnosisViewModel {
  id: string
  name: string
  geometry: SectorRiskResponse['sectors'][number]['geometry']
  centroid: { lat: number; lon: number }
  area: DisplayValue
  terrain: {
    elevation: DisplayValue
    slope: DisplayValue
    aspect: DisplayValue
  }
  rotation: {
    status: 'resting' | 'cultivated'
    statusLabel: string
    yearsInStatus: number
    isSimulated: true
  }
  vegetation: {
    date: string
    dateText: string
    ndvi: DisplayValue
    anomaly: DisplayValue
  }
  risk: SectorRiskResponse['sectors'][number]['risk'] & {
    levelLabel: string
  }
  recovery: SectorRiskResponse['sectors'][number]['recovery'] & {
    levelLabel: string
  }
  recommendation: SectorRiskResponse['sectors'][number]['recommendation'] & {
    actionLabel: string
  }
  twinPrecedent: SectorRiskResponse['sectors'][number]['twin_precedent']
  isSimulated: true
}

export interface SectorSnapshotViewModel {
  scenario: SectorRiskResponse['scenario']
  scenarioLabel: string
  zone: ZoneViewModel
  sectors: SectorDiagnosisViewModel[]
  provenance: ProvenanceViewModel
}

export interface HistoryViewModel {
  sectorId: string
  from: string
  to: string
  sectorSeries: { date: string; ndvi: number | null }[]
  regionalSeries: {
    date: string
    precipMm: number | null
    soilMoisture: number | null
    tempC: number | null
  }[]
  globalSeries: { date: string; roni: number | null }[]
  provenance: ProvenanceViewModel
}

export interface BacktestViewModel {
  event: BacktestResponse['event']
  eventType: BacktestResponse['event_type']
  heldOut: boolean
  zone: BacktestResponse['zone']
  perSector: BacktestResponse['per_sector']
  perSectorMetric: BacktestResponse['per_sector_metric']
  note: string | null
  provenance: ProvenanceViewModel
}
