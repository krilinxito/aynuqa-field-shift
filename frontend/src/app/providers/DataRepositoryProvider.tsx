import { useState, type ReactNode } from 'react'

import { QueryClient } from '../../data/cache/QueryClient'
import type { DataRepository } from '../../data/repositories/DataRepository'
import { createDataRepository } from '../../data/repositories/createDataRepository'
import { DataRepositoryContext, type DataLayer } from './dataRepositoryContext'

interface DataRepositoryProviderProps {
  children: ReactNode
  repository?: DataRepository
  queryClient?: QueryClient
}

export function DataRepositoryProvider({
  children,
  repository,
  queryClient,
}: DataRepositoryProviderProps) {
  const [dataLayer] = useState<DataLayer>(() => ({
    repository: repository ?? createDataRepository(),
    queryClient: queryClient ?? new QueryClient(),
  }))

  return (
    <DataRepositoryContext.Provider value={dataLayer}>
      {children}
    </DataRepositoryContext.Provider>
  )
}
