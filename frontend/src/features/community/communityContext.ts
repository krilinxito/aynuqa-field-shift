import { createContext, use } from 'react'

import type { SectorSnapshotViewModel } from '../../domain/presentationModels'

export interface CommunityContextValue {
  snapshot: SectorSnapshotViewModel
  /** Abre el detalle de un sector. */
  onOpenSector: (sectorId: string) => void
}

export const CommunityContext = createContext<CommunityContextValue | null>(
  null,
)

export function useCommunity(): CommunityContextValue {
  const value = use(CommunityContext)

  if (!value) {
    throw new Error(
      'Las piezas de CommunityOverview van dentro de CommunityOverview.Provider.',
    )
  }

  return value
}
