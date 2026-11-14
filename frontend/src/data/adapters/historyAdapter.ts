import type { HistoryResponse } from '../contracts/generated'
import type { HistoryViewModel } from '../../domain/presentationModels'
import { adaptProvenance } from './provenanceAdapter'

export function adaptHistory(response: HistoryResponse): HistoryViewModel {
  return {
    sectorId: response.sector_id,
    from: response.from,
    to: response.to,
    sectorSeries: response.series.map(({ date, ndvi }) => ({ date, ndvi })),
    regionalSeries: response.series.map(
      ({ date, precip_mm, soil_moisture, temp_c }) => ({
        date,
        precipMm: precip_mm,
        soilMoisture: soil_moisture,
        tempC: temp_c,
      }),
    ),
    globalSeries: response.series.map(({ date, roni }) => ({ date, roni })),
    provenance: adaptProvenance({
      updatedAt: response.updated_at,
      dataSource: response.data_source,
    }),
  }
}
