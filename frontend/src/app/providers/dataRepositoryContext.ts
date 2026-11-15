import { createContext, useContext } from 'react'

import type { QueryClient } from '../../data/cache/QueryClient'
import type { DataRepository } from '../../data/repositories/DataRepository'

export interface DataLayer {
  repository: DataRepository
  queryClient: QueryClient
}

export const DataRepositoryContext = createContext<DataLayer | null>(null)

export function useDataLayer(): DataLayer {
  const value = useContext(DataRepositoryContext)

  if (!value) {
    throw new Error('useDataLayer debe usarse dentro de DataRepositoryProvider.')
  }

  return value
}
