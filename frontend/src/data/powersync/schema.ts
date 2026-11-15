import { Schema, Table, column } from '@powersync/web'

const offlineSnapshots = new Table(
  {
    dataset: column.text,
    cache_key: column.text,
    payload: column.text,
    updated_at: column.text,
  },
  { indexes: { lookup: ['dataset', 'cache_key'] } },
)

/** Lo que decidió la comunidad. Se escribe en el celular y sube con señal. */
const decisions = new Table(
  {
    community_id: column.text,
    sector_id: column.text,
    scenario: column.text,
    action: column.text,
    recommended_action: column.text,
    follows_recommendation: column.integer,
    note: column.text,
    decided_at: column.text,
  },
  { indexes: { by_sector: ['community_id', 'sector_id'] } },
)

export const AppSchema = new Schema({
  offline_snapshots: offlineSnapshots,
  decisions,
})
