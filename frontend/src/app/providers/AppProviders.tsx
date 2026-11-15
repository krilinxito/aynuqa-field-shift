import { SpeechProvider } from '../../features/speech/SpeechProvider'
import { LanguageProvider } from '../i18n/LanguageProvider'
import { AppShell } from '../layout/AppShell'
import { TextSizeProvider } from '../textsize/TextSizeProvider'
import { AppStateProvider } from './AppStateProvider'
import { DataRepositoryProvider } from './DataRepositoryProvider'

export function AppProviders() {
  return (
    <DataRepositoryProvider>
      <AppStateProvider>
        <LanguageProvider>
          <TextSizeProvider>
            <SpeechProvider>
              <AppShell />
            </SpeechProvider>
          </TextSizeProvider>
        </LanguageProvider>
      </AppStateProvider>
    </DataRepositoryProvider>
  )
}
