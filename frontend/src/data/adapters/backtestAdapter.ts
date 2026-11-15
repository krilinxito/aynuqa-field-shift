import type { BacktestResponse } from '../contracts/generated'
import type { BacktestViewModel } from '../../domain/presentationModels'
import { adaptProvenance } from './provenanceAdapter'

export function adaptBacktest(response: BacktestResponse): BacktestViewModel {
  return {
    event: response.event,
    eventType: response.event_type,
    heldOut: response.held_out,
    zone: response.zone,
    perSector: response.per_sector,
    perSectorMetric: response.per_sector_metric,
    note: response.note,
    provenance: adaptProvenance({
      updatedAt: response.updated_at,
      dataSource: response.data_source,
    }),
  }
}
