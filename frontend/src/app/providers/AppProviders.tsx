import { AppStateProvider } from './AppStateProvider'
import { DataRepositoryProvider } from './DataRepositoryProvider'
import { AppShell } from '../layout/AppShell'

export function AppProviders() {
  return (
    <DataRepositoryProvider>
      <AppStateProvider>
        <AppShell />
      </AppStateProvider>
    </DataRepositoryProvider>
  )
}
