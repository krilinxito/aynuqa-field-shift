import { SpeechProvider } from '../../features/speech/SpeechProvider'
import { AppShell } from '../layout/AppShell'
import { TextSizeProvider } from '../textsize/TextSizeProvider'
import { AppStateProvider } from './AppStateProvider'
import { DataRepositoryProvider } from './DataRepositoryProvider'

export function AppProviders() {
  return (
    <DataRepositoryProvider>
      <AppStateProvider>
        <TextSizeProvider>
          <SpeechProvider>
            <AppShell />
          </SpeechProvider>
        </TextSizeProvider>
      </AppStateProvider>
    </DataRepositoryProvider>
  )
}
