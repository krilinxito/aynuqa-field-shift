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

export const AppSchema = new Schema({
  offline_snapshots: offlineSnapshots,
})
