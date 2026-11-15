import type { Decision } from '../contracts/generated'

/** Fila de la tabla local `decisions` (SQLite no tiene booleanos). */
export interface DecisionRow {
  id: string
  community_id: string
  sector_id: string
  scenario: string
  action: string
  recommended_action: string | null
  follows_recommendation: number
  note: string | null
  decided_at: string
}

export function rowToDecision(row: DecisionRow): Decision {
  return {
    id: row.id,
    community_id: row.community_id,
    sector_id: row.sector_id,
    scenario: row.scenario as Decision['scenario'],
    action: row.action as Decision['action'],
    recommended_action: row.recommended_action as Decision['recommended_action'],
    follows_recommendation: Boolean(row.follows_recommendation),
    note: row.note,
    decided_at: row.decided_at,
  }
}
