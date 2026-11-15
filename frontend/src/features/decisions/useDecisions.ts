import { useCallback, useEffect, useState } from 'react'

import { useDataLayer } from '../../app/providers/dataRepositoryContext'
import type { Decision, DecisionList } from '../../data/repositories/DataRepository'

export type DecisionsStatus = 'loading' | 'ready' | 'error'

/** Evento que escucha la llamita para celebrar una decisión guardada. */
export const DECISION_SAVED_EVENT = 'aynuqa:decision-saved'

export function newDecisionId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID()
  }
  // Navegadores viejos sin randomUUID: UUID v4 con Math.random.
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (char) => {
    const random = (Math.random() * 16) | 0
    return (char === 'x' ? random : (random & 0x3) | 0x8).toString(16)
  })
}

/** Decisiones guardadas de un sector (o de toda la comunidad), siempre al día. */
export function useDecisions(communityId: string | null, sectorId?: string) {
  const { repository } = useDataLayer()
  const [list, setList] = useState<DecisionList>({ decisions: [], pendingIds: [] })
  const [status, setStatus] = useState<DecisionsStatus>('loading')

  const refresh = useCallback(async () => {
    if (!communityId) return
    try {
      setList(await repository.listDecisions(communityId, sectorId))
      setStatus('ready')
    } catch {
      setStatus('error')
    }
  }, [communityId, repository, sectorId])

  useEffect(() => {
    // Primera carga y cada vez que cambian (guardado o sincronización).
    // eslint-disable-next-line react-hooks/set-state-in-effect -- carga inicial desde el repositorio
    void refresh()
    return repository.onDecisionsChange(() => void refresh())
  }, [refresh, repository])

  const save = useCallback(
    async (decision: Decision) => {
      await repository.saveDecision(decision)
      window.dispatchEvent(new CustomEvent(DECISION_SAVED_EVENT))
      await refresh()
    },
    [refresh, repository],
  )

  const remove = useCallback(
    async (id: string) => {
      await repository.deleteDecision(id)
      await refresh()
    },
    [refresh, repository],
  )

  return { ...list, status, save, remove }
}
