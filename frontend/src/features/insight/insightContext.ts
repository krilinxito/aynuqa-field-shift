import { createContext, use } from 'react'

import type { Scenario } from '../../data/repositories/DataRepository'
import type {
  ProvenanceViewModel,
  SectorDiagnosisViewModel,
  ZoneViewModel,
} from '../../domain/presentationModels'

export interface InsightContextValue {
  sector: SectorDiagnosisViewModel
  zone: ZoneViewModel
  scenario: Scenario
  provenance: ProvenanceViewModel
}

export const InsightContext = createContext<InsightContextValue | null>(null)

export function useInsight(): InsightContextValue {
  const value = use(InsightContext)

  if (!value) {
    throw new Error('Las piezas de SectorInsight van dentro de SectorInsight.Provider.')
  }

  return value
}
