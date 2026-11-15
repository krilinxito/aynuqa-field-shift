import type { HealthResponse } from '../contracts/generated'
import type { ProvenanceViewModel } from '../../domain/presentationModels'
import { formatDateTime } from './formatters'

interface ProvenanceInput {
  updatedAt: string
  dataSource?: 'mock' | 'real'
  isSimulated?: boolean
  sourceGroups?: HealthResponse['sources']
}

export function adaptProvenance({
  updatedAt,
  dataSource,
  isSimulated,
  sourceGroups,
}: ProvenanceInput): ProvenanceViewModel {
  return {
    updatedAt,
    updatedAtText: formatDateTime(updatedAt),
    dataSource: dataSource ?? null,
    isSimulated: isSimulated ?? null,
    sourceGroups: sourceGroups ?? null,
  }
}
