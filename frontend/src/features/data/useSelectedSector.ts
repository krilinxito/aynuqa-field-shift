import { useAppState } from '../../app/providers/appStateContext'
import type {
  SectorDiagnosisViewModel,
  SectorSnapshotViewModel,
} from '../../domain/presentationModels'
import { useSectorSnapshot } from './useSectorSnapshot'

export type SelectedSector =
  | { status: 'loading' }
  | { status: 'error' }
  /** Hay datos, pero la persona todavía no eligió un sector válido. */
  | { status: 'missing' }
  | {
      status: 'ready'
      sector: SectorDiagnosisViewModel
      snapshot: SectorSnapshotViewModel
    }

/** El sector elegido en el escenario actual, o por qué no se puede mostrar. */
export function useSelectedSector(): SelectedSector {
  const { state } = useAppState()
  const { status, snapshot } = useSectorSnapshot(state.scenario)

  if (!snapshot) {
    return { status: status === 'error' ? 'error' : 'loading' }
  }

  const sector = snapshot.sectors.find(
    (candidate) => candidate.id === state.selectedSectorId,
  )

  return sector ? { status: 'ready', sector, snapshot } : { status: 'missing' }
}
